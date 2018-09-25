<?php
namespace Materia;

class Widget_Asset_Dbstorage
{
	protected static $_instance;

	public static function instance()
	{
		static::$_instance = new Widget_Asset_Dbstorage();
		return static::$_instance;
	}

	public function lock_for_processing(string $id, string $size)
	{

	}

	public function unlock_for_processing(string $id, string $size)
	{

	}

	public function delete(string $id, bool $all_sizes, $size = null)
	{
		$query = \DB::delete()
			->from('asset_data')
			->where('id', $id);

		if ( ! $all_sizes) $query->where('size', $size);

		$query->execute();
	}

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

	public function download(string $id, string $size, string $target_file_path)
	{
		// Get fiel from db into temp file
		$results = \DB::select()
			->from('asset_data')
			->where('id', $id)
			->where('size', $size)
			->execute();

		if ($results->count() < 1) throw("Missing asset data for asset: {$id} {$size}");

		file_put_contents($target_file_path, $results[0]['data']);
		unset($results); // free up image data memory
	}

	/**
	 * Store asset data into the database
	 * @param  string $image_path String of binary image data to store in the db
	 * @param  string $size Which size variant is this data? EX: 'original', 'thumbnail'
	 * @return integer Size in bytes of the image being stored
	 */
	public function upload(Widget_Asset $asset, string $image_path, string $size, bool $is_update = false): int
	{
		if (\Materia\Util_Validator::is_valid_hash($asset->id) && empty($asset->type)) return false;

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
		];

		if ($is_update)
		{
			$query = \DB::update('asset_data')
				->where('id', $asset->id)
				->where('size', $size);
		}
		else
		{
			$query = \DB::insert('asset_data');
			$data['created_at'] = time();
		}

		try
		{
			$query
				->set($data)
				->execute();
		}
		catch (\Exception $e)
		{
			\LOG::error('Exception while storing asset data for user id,'.\Model_User::find_current_id().': '.$e);
			throw($e);
		}

		return $bytes;
	}
}
