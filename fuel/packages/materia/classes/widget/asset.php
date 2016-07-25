<?php
/**
 * Materia
 * It's a thing
 *
 * @package	    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */


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
	const LARGE_PATH        = 'materia/media/large/';
	const THUMB_PATH        = 'materia/media/thumbnail/';

	public $created_at = 0;
	public $id         = 0;
	public $is_shared;
	public $title      = '';
	public $remote_url = null;
	public $file_size  = '';
	public $questions  = [];
	public $type       = '';
	public $widgets    = [];

	public function set_properties($properties=[])
	{
		if ( ! empty($properties))
		{
			foreach ($properties as $key => $val)
			{
				if (property_exists($this, $key)) $this->{$key} = $val;
			}
			$this->type = strtolower($this->type);
			switch ($this->type)
			{
				case 'jpeg':
					$this->type = 'jpg';
					break;
			}
		}
	}

	/**
	 * NEEDS DOCUMENTATION
	 */
	public function __construct($properties=[])
	{
		$this->set_properties($properties);
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param The database manager
	 */	
	public function db_update()
	{
		if ( ! empty($this->type) )
		{
			\DB::start_transaction();

			try
			{
				$tr = \DB::update('asset')
					->set([
						'type'        => $this->type,
						'title'       => $this->title,
						'remote_url'  => $this->remote_url,
						'file_size'   => $this->file_size,
						'created_at'  => time()
					])
					->where('id','=',$this->id)
					->execute();

				if ($tr == 1)
				{
					\DB::commit_transaction();
					return true;
				}

			}
			catch (Exception $e)
			{
				\DB::rollback_transaction();
				return false;
			}
		}
		return false;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param The database manager
	 */	
	public function db_store()
	{
		if ( ! \RocketDuck\Util_Validator::is_valid_hash($this->id) && ! empty($this->type))
		{
			// get an unused asset_id
			$max_tries = 10;
			for ($i = 0; $i <= $max_tries; $i++) {
				$asset_id = Widget_Instance_Hash::generate_key_hash();
				$asset_exists = $this->db_get($asset_id);
				if (! $asset_exists){
					break;
				}
			}
			if ($asset_exists){ // all attempted ids already exist
				return false;
			}

			\DB::start_transaction();

			try
			{
				$tr = \DB::insert('asset')
					->set([
						'id'          => $asset_id,
						'type'        => $this->type,
						'title'       => $this->title,
						'remote_url'  => $this->remote_url,
						'file_size'   => $this->file_size,
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
				\DB::rollback_transaction();
				return false;
			}
		}
		return false;
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
			return \Config::get('materia.dirs.media').$this->id.'.'.$this->type;
		}
		else
		{
			return  \Config::get('materia.dirs.media').$this->id.'.'.$new_type;
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
		return \Config::get('materia.dirs.media').$this->id.'_p.jpg'; // NOTE: preview's will always be jpg
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
		if (strlen($this->id) > 0)
		{
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
				\DB::rollback_transaction();
				return false;
			}
		}
		return false;
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