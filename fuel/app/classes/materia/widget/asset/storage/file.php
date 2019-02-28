<?php
namespace Materia;

class Widget_Asset_Storage_File implements Widget_Asset_Storage_Driver
{
	protected static $_instance;
	protected static $_config;
	protected static $_area;
	protected static $_area_tmp;

	/**
	 * Get an instance of this class
	 * @return object Widget_Asset_Storage_Driver
	 */
	public static function instance(array $config): Widget_Asset_Storage_Driver
	{
		static::$_config = $config;
		$config = [
			'basedir'   => $config['media_dir'],
			'use_locks' => true
		];
		static::$_area = \File::forge($config);
		static::$_area_tmp = \File::forge(['basedir' => '/tmp']);
		static::$_instance = new Widget_Asset_Storage_File();
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
		$area = $this->get_file_area();

		if ($size !== '*')
		{
			foreach (glob(static::$_config['media_dir']."{$id}_*") as $file)
			{
				\File::delete($file, static::$_area);
			}
		}
		else
		{
			if ($this->exists($id, $size))
			{
				$file = $this->get_local_file_path($id, $size);
				\File::delete($file, static::$_area);
			}
		}
	}

	/**
	 * Does a specific size of an asset exist
	 * @param  string $id   Asset Id
	 * @param  string $size Asset size
	 * @return bool         True if data exists
	 */
	public function exists(string $id, string $size): bool
	{
		$file = $this->get_local_file_path($id, $size);
		return \File::exists($file, static::$_area);
	}

	/**
	 * Copy asset data of a specific size into a temporary file
	 * @param  string $id               Asset Id
	 * @param  string $size             Asset Size
	 * @param  string $target_file_path Path to a file to write download into.
	 */
	public function retrieve(string $id, string $size, string $target_file_path): void
	{
		if ( ! $this->exists($id, $size)) throw new \Exception("Missing asset data for asset: {$id} {$size}");
		$file = $this->get_local_file_path($id, $size);
		// Materia makes this file for us, we need to delete it to use copy
		@unlink($target_file_path);
		\File::copy($file, $target_file_path, static::$_area, static::$_area_tmp);
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

		$file = $this->get_local_file_path($asset->id, $size);
		\File::copy($image_path, $file, null, static::$_area); // this may be relying on the media area defined in config/file.php
	}

	/**
	 * Uses this modules config to get the local file path to an asset.
	 * Does not check if file exists
	 * @param  string $id   Asset Id
	 * @param  string $size  Size of asset
	 * @return string       full absolute path to the file
	 */
	protected function get_local_file_path(string $id, string $size): string
	{
		// needs to use realpath due to fuelphp's file class (it'll append the area's filebase if it doesnt match)
		return realpath(static::$_config['media_dir']).DS."{$id}_{$size}";
	}

}
