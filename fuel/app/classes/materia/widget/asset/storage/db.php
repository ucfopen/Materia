<?php
namespace Materia;

class Widget_Asset_Storage_Db implements Widget_Asset_Storage_Driver
{
	protected static $_instance;
	protected static $_config;

	/**
	 * Get an instance of this class
	 * @return object Widget_Asset_Storage_Driver
	 */
	public static function instance(array $config): Widget_Asset_Storage_Driver
	{
		static::$_config = $config;
		static::$_instance = new Widget_Asset_Storage_Db();
		return static::$_instance;
	}

	/**
	 * Create a lock on a specific size of an asset.
	 * Used to prevent multiple requests from using excessive resources.
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 */
	public function lock_for_processing(string $id, string $size): void
	{
		// @TODO
	}

	/**
	 * Unlock a lock made for a specific size of an asset
	 * Used to prevent multiple requests from using excessive resources.
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 */
	public function unlock_for_processing(string $id, string $size): void
	{
		// @TODO
	}

	/**
	 * Delete asset data. Set size to '*' to delete all.
	 * @param  string $id        Asset Id of asset data to delete
	 * @param  [type] $size      Size to delete. Set to '*' to delete all.
	 */
	public function delete(string $id, string $size = '*'): void
	{
		$query = \DB::delete()
			->from('asset_data')
			->where('id', $id);

		if ($size !== '*') $query->where('size', $size);

		$query->execute();
	}

	/**
	 * Does a specific size of an asset exist
	 * @param  string $id   Asset Id
	 * @param  string $size Asset size
	 * @return bool         True if data exists
	 */
	public function exists(string $id, string $size): bool
	{
		// Get fiel from db into temp file
		$results = \DB::select('id')
			->from('asset_data')
			->where('id', $id)
			->where('size', $size)
			->execute();

		return $results->count() > 0;
	}

	/**
	 * Copy asset data of a specific size into a file
	 * @param  string $id               Asset Id
	 * @param  string $size             Asset Size
	 * @param  string $target_file_path Path to a file to write download into.
	 */
	public function retrieve(string $id, string $size, string $target_file_path): void
	{
		// Get fiel from db into temp file
		$results = \DB::select()
			->from('asset_data')
			->where('id', $id)
			->where('size', $size)
			->execute();

		if ($results->count() < 1) throw new \Exception("Missing asset data for asset: {$id} {$size}");

		file_put_contents($target_file_path, $results[0]['data']);
		unset($results); // free up image data memory
	}

	/**
	 * Store asset data into the database
	 * @param  Widget_Asset $asset      Asset object to insert
	 * @param  string       $image_path String of binary image data to store in the db
	 * @param  string       $size       Which size variant is this data? EX: 'original', 'thumbnail'
	 */
	public function store(Widget_Asset $asset, string $image_path, string $size): void
	{
		if ( ! $asset->is_valid()) throw new \Exception('Invalid asset for storing');

		$image_data = file_get_contents($image_path);

		$sha1_hash = sha1($image_data);
		$bytes = function_exists('mb_strlen') ? mb_strlen($image_data, '8bit') : strlen($image_data);

		$data = [
			'id'         => $asset->id,
			'type'       => $asset->type,
			'size'       => $size,
			'bytes'      => $bytes,
			'status'     => 'ready',
			'hash'       => $sha1_hash,
			'data'       => $image_data,
			'created_at' => time(),
		];

		try
		{
			\DB::insert('asset_data')
				->set($data)
				->execute();
		}
		catch (\Exception $e)
		{
			\LOG::error('Exception while storing asset data for user id,'.\Model_User::find_current_id().': '.$e);
			throw($e);
		}
	}
}
