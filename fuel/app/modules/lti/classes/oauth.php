<?php
namespace Lti;
require_once(APPPATH.'/modules/lti/vendor/oauth.php');

class Oauth
{
	public static function validate_post()
	{
		try
		{
			$signature  = \Input::post('oauth_signature', '');
			$timestamp  = (int) \Input::post('oauth_timestamp', 0);
			$nonce      = \Input::post('oauth_nonce', false);
			$lti_config = \Config::get("lti::lti.consumers.".\Input::post('tool_consumer_info_product_family_code', 'default'));

			if (empty($signature) || empty($timestamp) || empty($nonce)) throw new \Exception('Oauth, required stuff is empty');
			if ($lti_config['key'] !== \Input::post('oauth_consumer_key')) throw new \Exception('Oauth Consumer Key');
			if ($timestamp < time() - $lti_config['timeout']) throw new \Exception('Oauth timestamp too old');

			// TODO: check to see if the nonce is already used
			$consumer    = new \OAuthConsumer(null, $lti_config['secret']);
			$request     = \OAuthRequest::from_consumer_and_token($consumer, null, 'POST', \Uri::current(), \Input::post());
			$hash_method = '\OAuthSignatureMethod_'.str_replace('-', '_', \Input::post('oauth_signature_method', 'HMAC_SHA1'));
			$new_sig     = $request->build_signature(new $hash_method(), $consumer, null);

			return $new_sig === $signature;
		}
		catch (\Exception $e)
		{
			\RocketDuck\Log::profile(['invalid-oauth-received', $e->getMessage(), \Uri::current(), print_r(\Input::post(), 1)], 'lti-error-dump');
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
		$consumer = new \OAuthConsumer($key, $secret);
		$request  = \OAuthRequest::from_consumer_and_token($consumer, null, 'POST', $endpoint, $params);
		$request->sign_request(new \OAuthSignatureMethod_HMAC_SHA1(), $consumer, null);

		return $request->get_parameters();
	}

	public static function send_body_hashed_post($endpoint, $body, $secret)
	{
		// ================ BUILD OAUTH REQUEST =========================
		$body_hash = base64_encode(sha1($body, true)); // hash the contents of the body
		$consumer  = new \OAuthConsumer(null, $secret); // create the consumer (key not sent because it's not used for the signature)
		$request   = \OAuthRequest::from_consumer_and_token($consumer, null, 'POST', $endpoint, ['oauth_body_hash' => $body_hash] );
		$request->sign_request(new \OAuthSignatureMethod_HMAC_SHA1(), $consumer, null);
		$params = [
			'http' => [
				'method'  => 'POST',
				'content' => $body,
				'header'  => $request->to_header()."\r\nContent-Type: application/xml\r\n",
			]
		];

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
				return $success[0] == 'success';
			}
		}
		catch (\Exception $e)
		{
			\RocketDuck\Log::profile(['send-oath-post-failure', $e->getMessage(), $endpoint, print_r($params, true)], 'lti-error-dump');
		}

		return false;
	}
}
