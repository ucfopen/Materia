<?php
namespace Materia;

interface Widget_Asset_Storage_Driver
{
	/**
	 * Get an instance of this class
	 */
	public static function instance(array $config): Widget_Asset_Storage_Driver;

	/**
	 * Create a lock on a specific size of an asset.
	 * Used to prevent multiple requests from using excessive resources.
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 */
	public function lock_for_processing(string $id, string $size): void;

	/**
	 * Unlock a lock made for a specific size of an asset
	 * Used to prevent multiple requests from using excessive resources.
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 */
	public function unlock_for_processing(string $id, string $size): void;

	/**
	 * Delete asset data. Set size to '*' to delete all.
	 * @param  string $id        Asset Id of asset data to delete
	 * @param  [type] $size      Size to delete. Set to '*' to delete all.
	 */
	public function delete(string $id, string $size = '*'): void;

	/**
	 * Does a specific size of an asset exist?
	 * @param  string $id   Asset Id
	 * @param  string $size Asset size
	 * @return bool         True if data exists
	 */
	public function exists(string $id, string $size): bool;

	/**
	 * Copy asset data of a specific size from the storage driver's storage
	 * @param  string $id               Asset Id
	 * @param  string $size             Asset Size
	 * @param  string $target_file_path Path to a file to write download into.
	 */
	public function retrieve(string $id, string $size, string $target_file_path): void;

	/**
	 * Store asset data into the storage driver's storage mechanism
	 * @param  Widget_Asset $asset      Asset object to insert
	 * @param  string       $image_path String of binary image data to store in the db
	 * @param  string       $size       Which size variant is this data? EX: 'original', 'thumbnail'
	 */
	public function store(Widget_Asset $asset, string $image_path, string $size): void;


}
