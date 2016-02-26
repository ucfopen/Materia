<?php

class Cache extends Fuel\Core\Cache
{

	public static function easy_get($key)
	{
		try
		{
			return self::get($key);
		}
		catch (CacheExpiredException $e)
		{
		}
		catch (CacheNotFoundException $e)
		{
		}

		return null;
	}
}
