<?php

namespace Lti;

class Oauth
{
	public static function validate_post()
	{
		if (\Input::post('oauth_nonce', false) == false) return false;

		$timestamp_checker = function($provider)
		{
			$config = \Input::post('tool_consumer_info_product_family_code');
			if (is_null($config)) return OAUTH_CONSUMER_KEY_UNKNOWN;

			$timeout = \Config::get("lti::lti.consumers.$config.timeout");
			if (is_null($timeout)) return OAUTH_CONSUMER_KEY_UNKNOWN;

			// TODO: check to see if the nonce is already used

			return ($provider->timestamp >= time() - $timeout) ? OAUTH_OK : OAUTH_TOKEN_EXPIRED;
		};

		$consumer_handler = function($provider)
		{
			$config = \Input::post('tool_consumer_info_product_family_code');
			if (is_null($config)) return OAUTH_CONSUMER_KEY_UNKNOWN;

			$key = \Config::get("lti::lti.consumers.$config.key");
			if (is_null($key)) return OAUTH_CONSUMER_KEY_UNKNOWN;
			if ($key != $provider->consumer_key) return OAUTH_CONSUMER_KEY_UNKNOWN;

			$secret = \Config::get("lti::lti.consumers.$config.secret");
			if (is_null($secret)) return OAUTH_CONSUMER_KEY_UNKNOWN;

			$provider->consumer_secret = $secret;
			return OAUTH_OK;
		};

		// ===============  VALIDATE THE OAUTH SIG ===============
		try
		{
			$provider = new \OAuthProvider();
			$provider->consumerHandler($consumer_handler);
			$provider->timestampNonceHandler($timestamp_checker);
			$provider->is2LeggedEndpoint(true);
			$provider->checkOAuthRequest();
			return true;
		}
		catch (\OAuthException $e)
		{
			trace('rdLTI OAuth invalid');
			trace(\OAuthProvider::reportProblem($e));
			return false;
		}
	}

	public static function build_post_args(\Model_User $user, $endpoint, $params, $key, $secret, $enable_passback)
	{
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

		$params = array_merge($params, $oauth_params);

		if ($enable_passback) $params['lis_outcome_service_url'] = \Uri::create('lti/passback');

		require_once(APPPATH.'/modules/lti/vendor/oauth.php');

		$consumer = new \OAuthConsumer('', $secret);
		$request = \OAuthRequest::from_consumer_and_token($consumer, '', 'POST', $endpoint );
		foreach ($params as $key => $val)
		{
			$request->set_parameter($key, $val, false);
		}
		$request->sign_request(new \OAuthSignatureMethod_HMAC_SHA1(), $consumer, '');

		return $request->get_parameters();
	}

	public static function send_body_hashed_post($end_point, $body, $secret)
	{
		// ================ BUILD OAUTH REQUEST =========================
		require_once(APPPATH.'/modules/lti/vendor/oauth.php');

		$body_hash = base64_encode(sha1($body, true)); // build body hash
		$consumer = new \OAuthConsumer('', $secret); // create the consumer

		$request = \OAuthRequest::from_consumer_and_token($consumer, '', 'POST', $end_point, ['oauth_body_hash' => $body_hash] );
		$request->sign_request(new \OAuthSignatureMethod_HMAC_SHA1(), $consumer, '');

		$stream_headers = $request->to_header()."\r\nContent-Type: application/xml\r\n"; // add content type header

		// ================= SEND REQUEST =================================
		// try stream first
		$params = ['http' => ['method' => 'POST', 'content' => $body, 'header' => $stream_headers]];
		$stream_context = stream_context_create($params);
		$file = @fopen($end_point, 'rb', false, $stream_context);
		if ($file)
		{
			$response = @stream_get_contents($file);
		}
		// fall back to pecl_http
		elseif (defined('HTTP_METH_POST'))
		{
			// create an keyed array 'name' => 'value'
			$headers = explode("\r\n", $stream_headers);
			$pecl_headers = [];
			foreach ($headers as $h)
			{
				if ( ! empty($h))
				{
					$name = substr($h, 0, strpos($h, ':'));
					$pecl_headers[$name] = substr($h, strpos($h, ':') + 2);
				}
			}
			try
			{
				$request = new \HttpRequest($end_point, HTTP_METH_POST);
				$request->setHeaders($pecl_headers);
				$request->setBody($body);
				$request->send();
				$response = $request->getResponseBody();
			}
			catch (Exception $e)
			{
				trace($e);
				$response = false;
			}
		}
		else
		{
			// No way to contact server, so write it in the log!
			\RocketDuck\Log::profile(['cant-send-data', $end_point], 'lti-error-dump');

			return false;
		}
		// success ?
		if ($response)
		{
			$xml = simplexml_load_string($response);
			$success = $xml->imsx_POXHeader->imsx_POXResponseHeaderInfo->imsx_statusInfo->imsx_codeMajor;
			return ! empty($success) && $success[0] == 'success';
		}

		return false;
	}

}