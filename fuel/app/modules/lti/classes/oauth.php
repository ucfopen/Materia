<?php
namespace Lti;

class Oauth
{
	public static function validate_post()
	{
		try
		{
			$signature  = \Input::post('oauth_signature', '');
			$timestamp  = (int) \Input::post('oauth_timestamp', 0);
			$nonce      = \Input::post('oauth_nonce', false);
			$lti_config = \Config::get('lti::lti.consumers.'.\Input::post('tool_consumer_info_product_family_code', 'default'));

			if (empty($signature)) throw new \Exception('Authorization signature is missing.');
			if (empty($nonce)) throw new \Exception('Authorization fingerprint is missing.');
			if (\Input::post('oauth_consumer_key') !== $lti_config['key']) throw new \Exception('Authorization signature failure.');
			if ($timestamp < (time() - $lti_config['timeout'])) throw new \Exception('Authorization signature is too old.');

			$hasher   = new \Eher\OAuth\HmacSha1(); // THIS CODE ASSUMES HMACSHA1, could be more versetile, but hey
			$consumer = new \Eher\OAuth\Consumer(null, $lti_config['secret']);
			$request  = \Eher\OAuth\Request::from_consumer_and_token($consumer, null, 'POST', \Uri::current(), \Input::post());
			$new_sig  = $request->build_signature($hasher, $consumer, false);

			if ($new_sig !== $signature) throw new \Exception('Authorization signature failure.');
			return true;
		}
		catch (\Exception $e)
		{
			\Materia\Log::profile(['invalid-oauth-received', $e->getMessage(), \Uri::current(), print_r(\Input::post(), 1)], 'lti-error-dump');
		}

		return false;
	}

	public static function build_post_args(\Model_User $user, $endpoint, $params, $key, $secret, $enable_passback)
	{
		if ($enable_passback) $params['lis_outcome_service_url'] = \Uri::create('lti/passback');
		$oauth_params = [
			'oauth_consumer_key'                     => $key,
			'lti_message_type'                       => 'basic-lti-launch-request',
			'tool_consumer_instance_guid'            => \Config::get('lti::lti.tool_consumer_instance_guid'),
			'tool_consumer_info_product_family_code' => \Config::get('lti::lti.tool_consumer_info_product_family_code'),
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
