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
	 * Create a lock on a specific size of an asset for one hour
	 * Used to prevent multiple requests from using excessive resources.
	 * For object locking to work, the bucket must have versioning enabled
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 */
	public function lock_for_period(string $id, string $size): void
	{
		$s3 = $this->get_s3_client();

		try {
			$s3->putObjectRetention([
				'Bucket' => static::$_config['bucket'],
				'Key' => $this->get_key_name($id, $size),
				'Retention' => [
					'Mode' => 'GOVERNANCE',
					'RetainUntilDate' => new \DateTime('+1 hour'),
				]
			]);
		}
		catch (\Exception $e)
		{
			$error_code = '';
			$source = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to lock asset for period {$id} {$size}. {$error_code} {$source}");
			throw new \Exception("S3: Failed to lock asset for period {$id} {$size}. {$error_code} {$source}");
		}
	}

	/**
	 * Get the lock status of a specific size of an asset
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 * @return bool         True if locked
	 */
	public function get_lock_retention(string $id, string $size): bool
	{
		$s3 = $this->get_s3_client();

		try {
			$result = $s3->getObjectRetention([
				'Bucket' => static::$_config['bucket'],
				'Key' => $this->get_key_name($id, $size)
			]);
			return $result['Retention']['Mode'] === 'GOVERNANCE'; // if it's not governance, it's not locked
		}
		catch (\Exception $e)
		{
			$error_code = '';
			$source = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to get lock retention status for asset {$id} {$size}. {$error_code} {$source}");
			return false;
		}
	}

	/**
	 * Lock a specific size of an asset
	 * Used to prevent multiple requests from using excessive resources.
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 */
	public function lock_for_processing(string $id, string $size): void
	{
		$s3 = $this->get_s3_client();

		try {
			$s3->putObjectLegalHold([
				'Bucket' => static::$_config['bucket'],
				'Key' => $this->get_key_name($id, $size),
				'LegalHold' => [
					'Status' => 'ON',
				]
			]);
		}
		catch (\Exception $e)
		{
			$error_code = '';
			$source = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to lock asset for processing {$id} {$size}. {$error_code} {$source}");
			throw new \Exception("S3: Failed to lock asset for processing {$id} {$size}. {$error_code} {$source}");
		}
	}

	/**
	 * Unlock a lock made for a specific size of an asset
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 */
	public function unlock_for_processing(string $id, string $size): void
	{
		$s3 = $this->get_s3_client();

		try {
			$s3->putObjectLegalHold([
				'Bucket' => static::$_config['bucket'],
				'Key' => $this->get_key_name($id, $size),
				'LegalHold' => [
					'Status' => 'OFF',
				]
			]);
		} catch (\Exception $e) {
			$error_code = '';
			$source = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to unlock asset {$id} {$size}. {$error_code} {$source}");
			throw new \Exception("S3: Failed to unlock asset {$id} {$size}. {$error_code} {$source}");
		}
	}

	/**
	 * Get the lock status of a specific size of an asset
	 * @param  string $id   Asset Id to lock
	 * @param  string $size Size of asset data to lock
	 * @return bool         True if locked
	 */
	public function get_lock(string $id, string $size): bool
	{
		$s3 = $this->get_s3_client();

		try {
			$result = $s3->getObjectLegalHold([
				'Bucket' => static::$_config['bucket'],
				'Key' => $this->get_key_name($id, $size)
			]);
			return $result['LegalHold']['Status'] === 'ON';
		}
		catch (\Exception $e)
		{
			$error_code = '';
			$source = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to get lock status for asset {$id} {$size}. {$error_code} {$source}");
			return false;
		}
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
			try {
				$s3->deleteObject([
					'Bucket' => static::$_config['bucket'],
					'Key' => $this->get_key_name($id, $size),
				]);
			} catch (\Exception $e) {
				$error_code = '';
				$source = '';
				if (get_class($e) == 'Aws\S3\Exception\S3Exception')
				{
					$error_code = $e->getAwsErrorCode();
					$source = $e->getAwsErrorMessage();
				}
				\Log::error("S3: Failed to delete asset {$id} {$size}. {$error_code} {$source}");
				throw new \Exception("S3: Failed to delete asset {$id} {$size}. {$error_code} {$source}");
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
		$s3 = $this->get_s3_client();

		try {
			return $s3->doesObjectExistV2(
				static::$_config['bucket'],
				$this->get_key_name($id, $size)
			);
		} catch (\Exception $e) {
			$error_code = '';
			$source = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to check if asset {$id} {$size} exists. {$error_code} {$source}");
			return false;
		}
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
			$source = '';
			$error_code = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to retrieve asset {$key}. {$error_code} {$source}");
			throw new \Exception("S3: Failed to retrieve asset {$key}. {$error_code} {$source}");
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

		\Log::info("Storing asset data in s3: {$key} ({$asset->get_mime_type()})");
		\Log::info("Asset data path: {$image_path}");
		\Log::info("Size: {$size}");
		\Log::info('Bucket: '.static::$_config['bucket']);
		\Log::info("Asset file_size: {$asset->file_size}");

		try {
			$s3 = $this->get_s3_client();

			$result = $s3->putObject([
				'Metadata'   => ['Content-Type' => $asset->get_mime_type()],
				'Bucket'     => static::$_config['bucket'],
				'Key'        => $key,
				'SourceFile' => $image_path,
				// 'Body'       => $image_data, // use instead of SourceFile to send data
			]);
		} catch (\Exception $e) {
			$error_code = '';
			$source = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to store asset {$key}. {$error_code} {$source}");
			throw new \Exception("S3: Failed to store asset {$key}. {$error_code} {$source}");
		}
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
			'endpoint'    => static::$_config['endpoint'] ?? '',
			'region'      => static::$_config['region'],
			'force_path_style' => static::$_config['force_path_style'] ?? false,
			'version'     => 'latest',
			'credentials' => [
				'key'    => static::$_config['key'],
				'secret' => static::$_config['secret_key'],
				'token'  => static::$_config['token'] ?? null,
			]
		];

		try {
			static::$_s3_client = new \Aws\S3\S3Client($config);
		} catch (\Exception $e) {
			$source = '';
			$error_code = '';
			if (get_class($e) == 'Aws\S3\Exception\S3Exception')
			{
				$error_code = $e->getAwsErrorCode();
				$source = $e->getAwsErrorMessage();
			}
			\Log::error("S3: Failed to create S3 client. {$error_code} {$source}");
			throw new \Exception("S3: Failed to create S3 client. {$error_code} {$source}");
		}
		return static::$_s3_client;
	}

}
