<?php
/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  asset * @author      ADD NAME HERE
 */

namespace Materia;

class Widget_Asset
{

	const MAP_TYPE_QSET     = '1';
	const MAP_TYPE_QUESTION = '2';

	public $created_at = 0;
	public $id         = 0;
	public $is_shared;
	public $title      = '';
	public $file_size  = '';
	public $remote_url = null;
	public $status     = null;
	public $questions  = [];
	public $type       = '';
	public $widgets    = [];

	public function __construct($properties=[])
	{
		$this->set_properties($properties);
	}

	/**
	 * Search and fetch the database for a Widget_Asset by it's ID
	 * @param  string $id ID of the Widget_Asset
	 * @return Widget_Asset
	 */
	static public function fetch_by_id(string $id): Widget_Asset
	{
		$asset = new Widget_Asset();
		$asset->db_get($id);
		return $asset;
	}

	public function set_properties($properties=[])
	{
		if ( ! empty($properties))
		{
			foreach ($properties as $key => $val)
			{
				if (property_exists($this, $key)) $this->{$key} = $val;
			}

			$this->type = strtolower($this->type);

			// give all jpg images a consistent extension
			if ($this->type == 'jpeg')
			{
				$this->type = 'jpg';
			}
		}
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param The database manager
	 */
	public function db_update()
	{
		if (empty($this->type)) return false;

		\DB::start_transaction();

		try
		{
			// ensure user has permission to update this asset
			$q = \DB::select()
				->from('perm_object_to_user')
				->where('object_id', $this->id)
				->and_where('user_id', \Model_User::find_current_id())
				->execute();

			// user should only own one object with this id
			if (count($q) == 1)
			{
				$tr = \DB::update('asset')
					->set([
						'type'        => $this->type,
						'title'       => $this->title,
						'file_size'   => $this->file_size,
						'remote_url'  => $this->remote_url,
						'status'      => $this->status,
						'created_at'  => time()
					])
					->where('id','=',$this->id)
					->execute();

				if ($tr == 1) // ensure only one asset is updated
				{
					\DB::commit_transaction();
					return true;
				}
				else
				{
					\LOG::error('Multiple assets exist with the same id: '.$this->id.'. None of these assets could be updated.');
					return false;
				}
			}
			else
			{
				\LOG::error('User id '.\Model_User::find_current_id().'owns zero or more than one object with the id: '.$this->id.'. Asset could not be updated.');
				return false;
			}
		}
		catch (Exception $e)
		{
			\DB::rollback_transaction();
			\LOG::error('The following exception occured while attempting to update asset id, '.$this->id.', for user id,'.\Model_User::find_current_id().': '.$e);
			return false;
		}
	}

	/**
	 * Finds an available asset id
	 * to avoid conflicts in the db
	 */
	public function get_unused_id()
	{
		// try finding an id not used in the database
		$max_tries = 10;
		for ($i = 0; $i <= $max_tries; $i++)
		{
			$asset_id = Widget_Instance_Hash::generate_key_hash();
			$asset_exists = $this->db_get($asset_id);
			if ( ! $asset_exists)
			{
				break;
			}
		}
		// all ids that were searched already exist
		if ($asset_exists)
		{
			return null;
		}

		return $asset_id;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param The database manager
	 */
	public function db_store()
	{
		if (\Materia\Util_Validator::is_valid_hash($this->id) && empty($this->type)) return false;

		$asset_id = $this->get_unused_id();
		if (empty($asset_id))
		{
			return false;
		}

		// if this asset has a remote_url stub, append the
		// id. otherwise, leave it null
		if (isset($this->remote_url))
		{
			// used to identify who uploaded asset
			$user_id = \Model_User::find_current_id();

			// Builds remote_url
			$this->remote_url .= "{$user_id}-{$asset_id}.{$this->type}";
		}

		\DB::start_transaction();

		try
		{
			$tr = \DB::insert('asset')
				->set([
					'id'          => $asset_id,
					'type'        => $this->type,
					'title'       => $this->title,
					'file_size'   => $this->file_size,
					'remote_url'  => $this->remote_url,
					'status'      => $this->status,
					'created_at'  => time()
				])
				->execute();

			$q = \DB::insert('perm_object_to_user')
				->set([
					'object_id'   => $asset_id,
					'user_id'     => \Model_User::find_current_id(),
					'perm'        => Perm::FULL,
					'object_type' => Perm::ASSET
				])
				->execute();

			if ($tr[1] > 0)
			{
				$this->id = $asset_id;
				\DB::commit_transaction();
				return true;
			}

		}
		catch (Exception $e)
		{
			\LOG::error('The following exception occured while attempting to store and asset for user id,'.\Model_User::find_current_id().': '.$e);
			\DB::rollback_transaction();
			return false;
		}
	}

	/**
	 * Store asset data into the database
	 * @param  string $image_data String of binary image data to store in the db
	 * @param  string $size Which size variant is this data? EX: 'original', 'thumbnail'
	 * @return integer Size in bytes of the image being stored
	 */
	public function db_store_data(string &$image_data, string $size, bool $is_update = false): int
	{
		if (\Materia\Util_Validator::is_valid_hash($this->id) && empty($this->type)) return false;

		$sha1_hash = sha1($image_data);
		$bytes = function_exists('mb_strlen') ? mb_strlen($image_data, '8bit') : strlen($image_data);

		$data = [
			'id'         => $this->id,
			'type'       => $this->type,
			'size'       => $size,
			'bytes'      => $bytes,
			'status'     => 'ready',
			'hash'       => $sha1_hash,
			'created_at' => time(),
			'data'       => $image_data,
		];

		if ($is_update)
		{
			$query = \DB::update('asset_data')
				->where('id', $this->id)
				->where('size', $size);
		}
		else
		{
			$query = \DB::insert('asset_data');
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

	/**
	 * Send the binary data of a specific sized variant of an asset to the client, resizing if needed.
	 * @param string $size Choose size variant to render. 'original', 'large', 'thumbnail'
	 * @return void
	 */
	public function render(string $size)
	{
		// register a shutdown function that will render the image
		// allowing all of fuel's other shutdown methods to do their jobs
		\Event::register('fuel-shutdown', function() use($size) {

			// set a few ini settings before we start
			ini_get('zlib.output_compression') and ini_set('zlib.output_compression', 0);
			! ini_get('safe_mode') and set_time_limit(0);

			// Get asset
			$results = \DB::select()
				->from('asset_data')
				->where('id', $this->id)
				->where('size', $size)
				->execute();


			if ($results->count() < 1)
			{
				// original is missing, just do nothing
				if ($size === 'original') return false;
				// resize the image on demand
				// mock db results with build_size returns
				$results = [$this->build_size($size)];
			}

			// turn off and clean output buffer
			while (ob_get_level() > 0) ob_end_clean();

			// Set headers and send the file
			header("Content-Type: {$this->get_mime_type()}");
			header("Content-Disposition: inline; filename=\"{$this->title}\"");
			header("Content-Length: {$results[0]['bytes']}");
			header('Content-Transfer-Encoding: binary');
			echo $results[0]['data'];
		});

		exit; // don't do anything else, just run shutdown
	}

	/**
	 * @return string Mime type based on $this->type for use in http headers
	 */
	public function get_mime_type(): string
	{
		switch ($this->type)
		{
			case 'png':
			case 'gif':
				return "image/{$this->type}";

			case 'jpeg':
			case 'jpg':
				return 'image/jpeg';

			case 'mp3':
				return 'audio/mpeg';
		}
	}

	/**
	 * Build a specified size of an asset.
	 * @param string $size Choose size variant to render. 'original', 'large', 'thumbnail'
	 * @return array Array containing 'data' (binary image data), and 'bytes' (integer byte size of image)
	 */
	protected function build_size(string $size): array
	{
		$crop = $size === 'thumbnail';
		switch ($size)
		{
			case 'thumbnail':
				$width = 75;
				break;

			case 'large':
				$width = 1024;
				break;

			default: // @codingStandardsIgnoreLine
				throw("Asset size not supported: '{$size}'");
				break;
		}

		// is another request in the middle of resizing?
		// if it is - this row will be locked, pausing the results of this query
		$results = \DB::select()
			->from('asset_data')
			->where('id', $this->id)
			->where('size', $size)
			->execute();

		// if anything returns here, it should already be built
		if ($results->count())
		{
			return [
				'data' => $data,
				'bytes' => $bytes
			];
		}

		// insert a row to reserve our spot
		// this row will be locked below
		// so other requests will pause waiting for it
		list($id, $num) = \DB::insert('asset_data')
			->set([
				'id'         => $this->id,
				'type'       => $this->type,
				'size'       => $size,
				'bytes'      => 0,
				'status'     => 'processing',
				'hash'       => '',
				'created_at' => time(),
				'data'       => '',
			])
			->execute();

		\DB::start_transaction();

		// get an exclusive lock on the row
		list($id, $num) = \DB::query(
			'SELECT id
				FROM '.\DB::quote_table('asset_data').'
				WHERE id = :asset_id
				FOR UPDATE',
			\DB::SELECT)
			->param('asset_id', $this->id)
			->execute();

		// Get original asset data
		$results = \DB::select()
			->from('asset_data')
			->where('id', $this->id)
			->where('size', 'original')
			->execute();

		if ($results->count() < 1) throw("Missing original asset data for asset: {$this->id}");

		$original_data = $results[0]['data'];
		$ext = ".{$this->type}";

		// copy image data into a temp file
		// Fuel's image manipulation requires the images to be files
		// So we'll put the original image data into a temp file
		// And place the resized image into another temp file
		$tmp_file_path = tempnam(sys_get_temp_dir(), "{$this->id}_orig_");
		file_put_contents($tmp_file_path, $original_data);
		unset($results, $original_data); // free up image data memory

		// add extension to tmp file so Image knows how to read it
		rename($tmp_file_path, $tmp_file_path .= $ext);

		// make a target file for resized image
		$resized_file_path = tempnam(sys_get_temp_dir(), "{$this->id}_{$size}_");
		// add extension to tmp file so Image knows what to write it
		rename($resized_file_path, $resized_file_path .= $ext);

		// Resize the image
		try
		{
			if ($crop)
			{
				\Image::load($tmp_file_path)
					->crop_resize($width, $width)
					->save($resized_file_path);
			}
			else
			{
				\Image::load($tmp_file_path)
					->resize($width, $width)
					->save($resized_file_path);
			}
		}
		catch (\RuntimeException $e)
		{
			\LOG::error($e);
			throw($e);
		}

		// write the resized data to the db
		$data = file_get_contents($resized_file_path);
		$bytes = $this->db_store_data($data, $size, true);

		// let go of the lock
		\DB::commit_transaction();

		// close the file handles and delete temp files
		unlink($tmp_file_path);
		unlink($resized_file_path);

		return [
			'data' => $data,
			'bytes' => $bytes
		];
	}

	/**
	 * New type is a string of the new type to specifiy the filetype of the returned file
	 *
	 * NEEDS DOCUMENTATION
	 *
	 * @param string NEEDS DOCUMENTATION
	 *
	 * @notes Path might need to be updated to however assets may be stored...
	 */
	public function get_file_name($new_type = '')
	{

		if ($new_type == '')
		{
			return \Config::get('file.dirs.media').$this->id.'.'.$this->type;
		}
		else
		{
			return  \Config::get('file.dirs.media').$this->id.'.'.$new_type;
		}
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @review Needs code review
	 */
	public function get_preview_file_name()
	{
		// NOTE: previews will go in the same directory as the assets
		// HACK CODE: hardcoding the _p.jpg for the preview files
		//     it should be a constant somewhere
		return \Config::get('file.dirs.media').$this->id.'_p.jpg'; // NOTE: preview's will always be jpg
		// also NOTE: it may not have a preview image, we return what the file name would be anyways
	}

	/**
	 * NEEDS DOCUMENTATION
	 * @TODO this function shouldn't ever skip removing perms - we should probably have a replace function instead of using this as a replace
	 * @notes (Nick) adding keep_perms to optionally prevent removing the perms
	 *                this is used in replacing assets -> we're going to give the new
	 *				 asset the old one's id, so go ahead and keep the perms for it
	 * @param object The database manager
	 * @param bool NEEDS DOCUMENTATION
	 */
	public function db_remove($keep_perms = false)
	{
		if (strlen($this->id) <= 0) return false;

		\DB::start_transaction();

		try
		{
			// delete asset
			\DB::delete('asset')
				->where('id', $this->id)
				->limit(1)
				->execute();

			// delete perms
			if ( ! $keep_perms)
			{
				// TODO: change to support hashes
				Perm_Manager::clear_all_perms_for_object($this->id, Perm::ASSET);
			}

			\DB::commit_transaction();

			// delete any files used in this class
			$this->remove_files(); // needs to be fixed...

			// clear this object
			$this->__construct();
			return true;
		}
		catch (Exception $e)
		{
			\LOG::error('The following exception occured while attempting to remove asset id, '.$this->id.', for user id,'.\Model_User::find_current_id().': '.$e);
			\DB::rollback_transaction();
			return false;
		}
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @notes this is called when we db_remove
	 * @notes (Nick) i moved this to a separate function when i was working
	 *			     on replace asset, but ended up not using it for that
	 */
	protected function remove_files()
	{

		$file_dir = $this->get_file_name();

		if (file_exists($file_dir))
		{
			@unlink($file_dir);
		}

		$preview_file = $this->get_preview_file_name();

		if (file_exists($preview_file))
		{
			@unlink($preview_file);
		}
	}

	/**
	 * getGames is set to true if we want to get a list of games that the
	 *  asset is used in forUID, if getGames is set, will be set if the games
	 *  list should be specific for that user
	 *
	 * NEEDS DOCUMENTATION
	 *
	 * @param object The database manager
	 * @param int NEEDS DOCUMENTATION
	 */
	public function db_get($id)
	{
		// Get asset
		$results = \DB::select()
			->from('asset')
			->where('id', $id)
			->execute();

		if ($results->count() > 0)
		{
			$this->__construct($results[0]);
			return true;
		}
		return false;
	}
}
