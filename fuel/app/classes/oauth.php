<?php

class Oauth
{
	public static function validate_post()
	{
		try
		{
			$signature  = \Input::post('oauth_signature', '');
			$timestamp  = (int) \Input::post('oauth_timestamp', 0);
			$nonce      = \Input::post('oauth_nonce', false);
			$lti_config = LtiLaunch::config();

			if (empty($signature)) throw new \Exception('Authorization signature is missing.');
			if (empty($nonce)) throw new \Exception('Authorization fingerprint is missing.');
			if (\Input::post('oauth_consumer_key') !== $lti_config['key']) throw new \Exception('Authorization key failure.');
			if ($timestamp < (time() - $lti_config['timeout'])) throw new \Exception('Authorization signature is too old.');

			$hasher   = new \Eher\OAuth\HmacSha1(); // THIS CODE ASSUMES HMACSHA1, could be more versetile, but hey
			$consumer = new \Eher\OAuth\Consumer(null, $lti_config['secret']);
			$request  = \Eher\OAuth\Request::from_consumer_and_token($consumer, null, 'POST', \Uri::main(), \Input::post());
			$new_sig  = $request->build_signature($hasher, $consumer, false);

			if ($new_sig !== $signature) throw new \Exception('Authorization signature failure.');
			return true;
		}
		catch (\Exception $e)
		{
			\Materia\Log::profile(['invalid-oauth-received', $e->getMessage(), \Uri::main(), print_r(\Input::post(), 1)], 'lti-error-dump');
		}

		return false;
	}

	public static function build_post_args(\Model_User $user, $endpoint, $params, $key, $secret, $enable_passback)
	{
		if ($enable_passback) $params['lis_outcome_service_url'] = \Uri::create('lti/passback');
		$oauth_params = [
			'oauth_consumer_key'                     => $key,
			'lti_message_type'                       => 'basic-lti-launch-request',
			'tool_consumer_instance_guid'            => \Config::get('lti.tool_consumer_instance_guid'),
			'tool_consumer_info_product_family_code' => \Config::get('lti.tool_consumer_info_product_family_code'),
			'tool_consumer_instance_contact_email'   => \Config::get('materia.system_email'),
			'tool_consumer_info_version'             => \Config::get('materia.system_version'),
			'user_id'                                => $user->id,
			'lis_person_sourcedid'                   => $user->username,
			'lis_person_contact_email_primary'       => $user->email,
			'launch_presentation_document_target'    => 'iframe',
			'lis_person_name_given'                  => $user->first,
			'lis_person_name_family'                 => $user->last,
		];

		$params   = array_merge($params, $oauth_params);
		$hmcsha1  = new \Eher\OAuth\HmacSha1();
		$consumer = new \Eher\OAuth\Consumer('', $secret);
		$request  = \Eher\OAuth\Request::from_consumer_and_token($consumer, null, 'POST', $endpoint, $params);

		$request->sign_request($hmcsha1, $consumer, '');

		return $request->get_parameters();
	}

	// a custom parse_str that protects dots in variable names in the query string
	static private function _safer_parse_str($data)
	{
		$data = preg_replace_callback('/(?:^|(?<=&))[^=[]+/', function($match) {
			return bin2hex(urldecode($match[0]));
		}, $data);

		parse_str($data, $values);

		return array_combine(array_map('hex2bin', array_keys($values)), $values);
	}


	public static function sign_content_item_selection(string $url, string $content_items, string $lti_key)
	{
		$lti_config = \LtiLaunch::config_from_key($lti_key);

		if (is_null($lti_config))
		{
			throw new \Exception('Lti key not found.');
		}

		$params = [
			'lti_message_type' => 'ContentItemSelection',
			'lti_version' => 'LTI-1p0',
			'content_items' => $content_items,
			'data' => '{"sent_by": "Materia"}',
			'oauth_nonce' => sodium_bin2hex(random_bytes(SODIUM_CRYPTO_STREAM_KEYBYTES)),
			'oauth_timestamp' => time(),
			'oauth_callback' => 'about:blank',
			'oauth_consumer_key' => $lti_key,
			'oauth_signature_method' => 'HMAC-SHA1',
			'oauth_version' => '1.0',
		];

		$secret = $lti_config['secret'] ?? false;
		$hmc_sha1 = new \Eher\OAuth\HmacSha1();
		$consumer = new \Eher\OAuth\Consumer('', $secret);

		$request = \Eher\OAuth\Request::from_consumer_and_token($consumer, null, 'post', $url, $params);
		$base_string = $request->get_signature_base_string();
		$request->sign_request($hmc_sha1, $consumer, '');
		$results = $request->get_parameters();

		\Materia\Log::profile(['lti-content-item-select', $url, print_r($params, 1), print_r($results, 1), $base_string,], 'lti-launch');

		if ($lti_config['enforce_unique_params'] === true)
		{
			// if a param in the url, remove it from the results
			$query_str = parse_url($url, PHP_URL_QUERY);
			$query_params = self::_safer_parse_str($query_str);
			if (is_array($query_params))
			{
				$keys = array_keys($query_params);
				foreach ($keys as $key)
				{
					if (isset($results[$key]))
					{
						unset($results[$key]);
					}
				}
			}
		}

		return $results;
	}

	public static function send_body_hashed_post($endpoint, $body, $secret, $key = null)
	{
		// ================ BUILD OAUTH REQUEST =========================
		$body_hash = base64_encode(sha1($body, true)); // hash the contents of the body
		$hmcsha1   = new \Eher\OAuth\HmacSha1();
		$consumer  = new \Eher\OAuth\Consumer($key, $secret);
		$request   = \Eher\OAuth\Request::from_consumer_and_token($consumer, null, 'POST', $endpoint, ['oauth_body_hash' => $body_hash]);
		$request->sign_request($hmcsha1, $consumer, null);

		$params = [
			'http' => [
				'method'  => 'POST',
				'content' => $body,
				'header'  => $request->to_header()."\r\nContent-Type: application/xml\r\n",
			]
		];

		// in development, allow self-signed certs from the destination
		if (\Fuel::$env === 'development')
		{
			$params['ssl'] = [
				'verify_peer'       => false,
				'verify_peer_name'  => false,
				'allow_self_signed' => true,
			];
		}

		// ================= SEND REQUEST ===================
		try
		{
			$stream_context = stream_context_create($params);
			$file = fopen($endpoint, 'rb', false, $stream_context);
			if ($file)
			{
				$response = stream_get_contents($file);
				$xml      = simplexml_load_string($response);
				$success  = $xml->imsx_POXHeader->imsx_POXResponseHeaderInfo->imsx_statusInfo->imsx_codeMajor;
				$result   = $success[0] == 'success';
				if ($result == false)
				{
					\Materia\Log::profile(['passback-failure', $body, $response], 'lti-error-dump');
				}
				return $result;
			}
		}
		catch (\Exception $e)
		{
			\Materia\Log::profile(['send-oath-post-failure', $e->getMessage(), $endpoint, print_r($params, true)], 'lti-error-dump');
		}

		return false;
	}
}
