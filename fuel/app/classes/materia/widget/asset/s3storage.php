<?php
namespace Materia;

class Widget_Asset_S3storage
{

	protected static $_instance;
	protected static $_s3_client;

	public static function instance()
	{
		static::$_instance = new Widget_Asset_S3storage();
		return static::$_instance;
	}

	public function lock_for_processing(string $id, string $size)
	{

	}

	public function unlock_for_processing(string $id, string $size)
	{

	}

	public function download(string $id, string $size, string $target_file_path)
	{
		$s3_config = \Config::get('materia.s3_config');
		// get file from s3 into temp file
		$s3 = $this->get_s3_client();

		$key = $this->get_key_name($id, $size);

		$result = $s3->getObject([
			'Bucket' => \Config::get('materia.s3_config.bucket'),
			'Key' => $key,
			'SaveAs' => $target_file_path,
		]);
	}

	public function exists(string $id, string $size): bool
	{
		$s3_config = \Config::get('materia.s3_config');
		$s3 = $this->get_s3_client();

		return $s3->doesObjectExist($s3_config['bucket'], $this->get_key_name($id, $size));
	}

	public function delete(string $id, bool $all_sizes, $size = null)
	{
		$s3_config = \Config::get('materia.s3_config');
		$s3 = $this->get_s3_client();

		if ($all_sizes)
		{
			$s3->deleteMatchingObjects($s3_config['bucket'], $this->get_key_name($id, 'original'), '*');
		}
		else
		{
			$s3->deleteObject([
				'Bucket' => $s3_config['bucket'],
				'Key' => $this->get_key_name($id, $size),
			]);
		}
	}

	/**
	 * Store asset data in s3
	 * @param  string $image_path String path to image to upload
	 * @param  string $size Which size variant is this data? EX: 'original', 'thumbnail'
	 * @return integer Size in bytes of the image being stored
	 */
	public function upload(Widget_Asset $asset, string $image_path, string $size, bool $is_update = false)
	{
		if (\Materia\Util_Validator::is_valid_hash($asset->id) && empty($asset->type)) return false;

		$s3_config = \Config::get('materia.s3_config');

		// Force all uploads in development to have the same bucket sub-directory
		$key = $this->get_key_name($asset->id, $size);

		$s3 = $this->get_s3_client();
		$result = $s3->putObject([
			'ACL'        => 'public-read',
			'Metadata'   => ['Content-Type' => $asset->get_mime_type()],
			'Bucket'     => $s3_config['bucket'],
			'Key'        => $key,
			'SourceFile' => $image_path,
			// 'Body'       => $image_data, // use instead of SourceFile to send data
		]);
	}

	protected function get_key_name(string $id, string $size): string
	{
		$s3_config = \Config::get('materia.s3_config');
		$key = ($s3_config['subdir'] ? $s3_config['subdir'].'/' : '').$id;
		if ($size !== 'original') $key .= "/{$size}";
		return $key;
	}

	protected function get_s3_client(): \Aws\S3\S3Client
	{
		if (static::$_s3_client) return static::$_s3_client;

		$s3_config = \Config::get('materia.s3_config');

		$config = [
			'endpoint'    => '',
			'region'      => $s3_config['region'],
			'version'     => 'latest',
			'credentials' => [
				'key'    => $s3_config['key'],
				'secret' => $s3_config['secret_key'],
			]
		];

		// should we use a mock endpoint for testing?
		if ($s3_config['endpoint'] !== false)
		{
			$config['endpoint'] = $s3_config['endpoint'];
		}

		static::$_s3_client = new \Aws\S3\S3Client($config);
		return static::$_s3_client;
	}

}
