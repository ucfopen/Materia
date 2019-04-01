<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api_Site extends Controller_Rest
{
	use \Trait_Apiutils;
	use \Trait_RateLimit;

	protected $_supported_formats = ['json' => 'application/json'];

	public function get_health_status()
	{
		$this->no_cache();

		static::$rate_limiter_down_time = 3600; // seconds
		static::$rate_limiter_max_count = 10; // attempts
		static::$rate_limiter_window    = 60; // seconds
		self::incement_rate_limiter();

		if ( ! self::check_rate_limiter())
		{
			$this->response(['error' => 'Rate limit exceeded'], 429);
			return;
		}

		$tests = [
			'database' => false,
			'cache' => false,
			'session' => false,
			'assets' => false,
			'authSalt' => false,
			'diskspace' => false,
		];

		// test database connection
		$q = \DB::query('SELECT 1 as good_to_go')->execute()->as_array();
		$tests['database'] = ! empty($q[0]['good_to_go']);

		// test cache set and get
		$random = uniqid();
		\Cache::set('health-status', $random, 300);
		$cache_value = \Cache::easy_get('health-status');
		$tests['cache'] = $cache_value === $random;

		\Session::set('health-status', $random);
		$session_value = \Session::get('health-status');
		$tests['session'] = $session_value === $random;


		if ($tests['database'])
		{
			$q = \Db::query('SELECT id from asset order by RAND() LIMIT 1')
				->execute()
				->as_array();

			$random_asset = \Materia\Widget_Asset::fetch_by_id($q[0]['id']);
			$path = $random_asset->copy_asset_to_temp_file($random_asset->id, 'original');
			$tests['assets'] = filesize($path) > 1;
			unset($path);
		}

		\Config::load('auth', true);
		$tests['authSalt'] = \Config::get('auth.salt', 'error') != 'SET THIS IN YOUR ENV CONFIG';


		$tests['diskspace'] = disk_free_space('.') > (200 /*mb*/ * 1024 * 1024);
		$this->response($tests, 200);
	}

}
