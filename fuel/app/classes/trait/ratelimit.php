<?php

trait Trait_RateLimit
{
	static $rate_limiter_down_time = 60; // 60 seconds
	static $rate_limiter_max_count = 50; // 50 attempts
	static $rate_limiter_window    = 60; // 60 seconds

	static protected function cache_string($prefix='rate-limit')
	{
		$ip = Input::real_ip('0.0.0.0', true);
		return $prefix.str_replace('.', '-', $ip);
	}

	static protected function get_rate_limiter()
	{
		$limit = Cache::easy_get(self::cache_string());
		if (is_null($limit))
		{
			$limit = ['start_time' => time(), 'count' => 0];
			Cache::set(self::cache_string(), $limit, self::$rate_limiter_down_time);
		}
		return $limit;
	}

	static public function check_rate_limiter()
	{
		if ( ! Fuel::$is_cli)
		{
			$limit = self::get_rate_limiter();
			// relies on the native cache timeout to reset the limiter
			if ($limit['count'] >= self::$rate_limiter_max_count) return false;
		}
		return true;
	}

	static protected function incement_rate_limiter()
	{
		if ( ! Fuel::$is_cli)
		{
			$limit = self::get_rate_limiter();
			if ($limit['start_time'] + self::$rate_limiter_window < time())
			{
				// reset
				$limit = ['start_time' => time(), 'count' => 0];
			}
			else
			{
				$limit['count'] += 1 ;
			}
			Cache::set(self::cache_string(), $limit, self::$rate_limiter_down_time);
		}
	}

	static protected function reset_rate_limiter()
	{
		if ( ! Fuel::$is_cli) Cache::delete(self::cache_string());
	}
}
