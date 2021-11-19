<?php
namespace Thirdparty;
// phpcs:disable FuelPHP.NamingConventions.ConciseUnderscoredVariableName

class Oauth
{
	public static function validate_post()
	{
		try
		{
			// get signature, timestamp, nonce from body formData
			$signature  = \Input::post('oauth_signature', '');
			$timestamp  = (int) \Input::post('oauth_timestamp', 0);
			$nonce      = \Input::post('oauth_nonce', false);

			// check to make sure all are present
			if (empty($signature)) throw new \Exception('Authorization signature is missing.');
			if (empty($nonce)) throw new \Exception('Authorization fingerprint is missing.');
			if (\Input::post('oauth_consumer_key') !== $_ENV['OAUTH_KEY']) throw new \Exception('Authorization signature failure.');

			// make sure request was made in the last hour
			if ($timestamp < (time() - 3600)) throw new \Exception('Authorization signature is too old.');

			// hash key and secret to make sure token matches
			$new_sig = hash_hmac('sha256', $_ENV['OAUTH_KEY'], $_ENV['OAUTH_SECRET'].$timestamp.$nonce, false);

			if ($new_sig !== $signature) throw new \Exception('Authorization signature failure.');
			return true;
		}
		catch (\Exception $e)
		{
			logger('DEBUG', 'ERROR: INVALID OAUTH EXCEPTION');
			logger('DEBUG', $e);
			// \Materia\Log::profile(['invalid-oauth-received', $e->getMessage(), \Uri::current(), print_r(\Input::post(), 1)], 'lti-error-dump');
		}

		return false;
	}
}