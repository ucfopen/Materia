<?php
namespace Materia;

class Widget_Asset_Storage_S3 implements Widget_Asset_Storage_Driver
{

	protected static $_instance;
	protected static $_s3_client;
	protected static $_config;

	/**
	 * Get an instance of this class
	 * @return object Widget_Asset_Storage_Driver
	 */
	public static function instance(array $config): Widget_Asset_Storage_Driver
	{
		static::$_config = $config;
		static::$_instance = new Widget_Asset_Storage_S3();
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
	 * @param  string $size      Size to delete. Set to '*' to delete all.
	 */
	public function delete(string $id, string $size = '*'): void
	{
		$s3 = $this->get_s3_client();

		if ($size === '*')
		{
			$s3->deleteMatchingObjects(static::$_config['bucket'], $this->get_key_name($id, 'original'), '*');
		}
		else
		{
			$s3->deleteObject([
				'Bucket' => static::$_config['bucket'],
				'Key' => $this->get_key_name($id, $size),
			]);
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
		$s3 = $this->get_s3_client();

		return $s3->doesObjectExist(static::$_config['bucket'], $this->get_key_name($id, $size));
	}

	/**
	 * Download an asset from s3 into a file
	 * @param  string $id               Asset Id
	 * @param  string $size             Asset Size
	 * @param  string $target_file_path Path to a file to write download into.
	 */
	public function retrieve(string $id, string $size, string $target_file_path): void
	{
		// get file from s3 into temp file
		$s3 = $this->get_s3_client();

		$key = $this->get_key_name($id, $size);

		try
		{
			$result = $s3->getObject([
				'Bucket' => static::$_config['bucket'],
				'Key' => $key,
				'SaveAs' => $target_file_path,
			]);
		} catch (\Exception $e)
		{
			throw new \Exception("Missing asset data for asset: {$id} {$size}");
		}
	}

	/**
	 * Store asset data in s3
	 * @param Widget_Asset $asset Asset Object
	 * @param  string $image_path String path to image to upload
	 * @param  string $size Which size variant is this data? EX: 'original', 'thumbnail'
	 */
	public function store(Widget_Asset $asset, string $image_path, string $size): void
	{
		if ( ! $asset->is_valid()) throw new \Exception('Invalid asset for storing');

		// Force all uploads in development to have the same bucket sub-directory
		$key = $this->get_key_name($asset->id, $size);

		$s3 = $this->get_s3_client();

		$result = $s3->putObject([
			'ACL'        => 'public-read',
			'Metadata'   => ['Content-Type' => $asset->get_mime_type()],
			'Bucket'     => static::$_config['bucket'],
			'Key'        => $key,
			'SourceFile' => $image_path,
			// 'Body'       => $image_data, // use instead of SourceFile to send data
		]);
	}

	/**
	 * Get the s3 key name for a specific asset id & size
	 * @param  string $id   Asset Id
	 * @param  string $size Asset Size
	 * @return string       Key of the s3 asset
	 */
	protected function get_key_name(string $id, string $size): string
	{
		$key = (static::$_config['subdir'] ? static::$_config['subdir'].'/' : '').$id;
		if ($size !== 'original') $key .= "/{$size}";
		return $key;
	}

	/**
	 * Get a reference to and S3Client object
	 * @return \Aws\S3\S3Client S3Client to send data to s3
	 */
	protected function get_s3_client(): \Aws\S3\S3Client
	{
		if (static::$_s3_client) return static::$_s3_client;

		$config = [
			'endpoint'    => '',
			'region'      => static::$_config['region'],
			'version'     => 'latest',
			'credentials' => [
				'key'    => static::$_config['key'],
				'secret' => static::$_config['secret_key'],
			]
		];

		// should we use a mock endpoint for testing?
		if (static::$_config['endpoint'] !== false)
		{
			$config['endpoint'] = static::$_config['endpoint'];
		}

		static::$_s3_client = new \Aws\S3\S3Client($config);
		return static::$_s3_client;
	}

}
