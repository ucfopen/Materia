<?php
/**
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  asset
 */
namespace Materia;
class Widget_Asset_Manager
{

	static public function update_asset($asset_id, $properties=[])
	{
		// find asset that was created on upload_keys_get
		$asset = Widget_Asset::fetch_by_id($asset_id);
		// if not found, returned asset is default empty asset object
		if (empty($asset->id))
		{
			return false; // didn't find asset with that id
		}

		$asset->set_properties($properties);
		return $asset->db_update();
	}

	static public function user_has_space_for($bytes)
	{
		$stats = Widget_Asset_Manager::get_user_asset_stats(\Model_User::find_current_id());
		return $stats['kbUsed'] + ($bytes / 1024.0) < $stats['kbAvail'];
	}

	// old method for server upload storage
	static public function new_asset_from_file($name, $file_info)
	{
		// Do I have space left?
		if ( ! Widget_Asset_Manager::user_has_space_for($file_info['size']) ) return false;

		$mime_type = mime_content_type($file_info['realpath']);
		$extension = Widget_Asset::get_type_from_mime_type($mime_type);

		// create and store the asset
		$asset = new Widget_Asset([
			'type'      => $extension,
			'title'     => $name,
			'file_size' => $file_info['size']
		]);

		// try to save the asset and move it
		if ($asset->db_store() && \Materia\Util_Validator::is_valid_hash($asset->id))
		{
			try
			{
				// store the data into the database
				$asset->upload_asset_data($file_info['realpath']);
				\File::delete($file_info['realpath'], 'media');

				// set perms
				Perm_Manager::set_user_object_perms($asset->id, Perm::ASSET, \Model_User::find_current_id(), [Perm::FULL => Perm::ENABLE]);
				return $asset;
			}
			catch (\OutsideAreaException | InvalidPathException | \FileAccessException $e)
			{
				trace($e);
			}

			// failed, remove the asset
			$asset->db_remove();
		}

		return $asset;
	}

	/**
	 * Find how many times an asset is being used.
	 *
	 * Does not count games that have been deleted (works for both drafts and non-drafts)
	 *
	 * @param int $id the id of the asset to count uses for
	 */
	static protected function can_asset_be_deleted($id)
	{
		// check if it is being used in a game or a draft
		if (Widget_Asset_Manager::get_asset_use_count($id) > 0)
		{
			return false;
		}
		// now check if it is owned or not, it could be in a media bank with 0 uses
		$num_owners = Perm_Manager::get_num_users_with_explicit_perms($id, Perm::ASSET);//, Perm::FULL
		// we can delete if there are no owners
		return $num_owners == 0;
	}
	/**
	 * Find how many times an asset is being used
	 * (works for both drafts and non-drafts)
	 *
	 * @param int $id the id of the asset to count uses for
	 */
	static public function get_asset_use_count($id)
	{
		$results = \DB::select([\DB::expr('COUNT(*)'), 'numUses'])
			->from(['map_asset_to_object', 'map'])
			->join(['widget_qset', 'qset'])
				->on('qset.id', '=', 'map.object_id')
			->join(['widget_instance', 'gi'])
				->on('gi.id', '=', 'qset.inst_id')
			->where('map.object_type', '1')
			->where('map.asset_id', $id)
			->execute();

		return $results[0]['numUses'];
	}
	/**
	 * Deletes an asset if it is eligible for delition
	 *
	 * @param int $id the ID of the asset to be deleted
	 * @return bool true if successful, false if not
	 */
	static public function delete_asset($id)
	{
		if (Widget_Asset_Manager::can_asset_be_deleted($id))
		{
			$asset = Widget_Asset::fetch_by_id($id);
			return $asset->db_remove();
		}
		return false;
	}

	/**
	 * NEEDS DOCUMENTATION
	 * @notes return a list of inst_ids that this asset is used in
	 * @notes are we going to have an asset used in game table? or part of assetlink?
	 * @notes this will also return drafts, should rename?
	 */
	static protected function get_widgets_by_asset($id)
	{
		// NOTE: asset link will now store uses of assets in games ->
		//    not (or in addition to?) uses of assets in groups and questions
		// we had talked about separating qsets from the qbank, and gs_asset_link would no longer need to
		// be the source of storing how assets get into games
		// so it could just be used as a way to track asset usage in games
		$results = \DB::select()
			->from('map_asset_to_object')
			->where('asset_id', $id)
			->where('type', Widget_Asset::MAP_TYPE_QSET)
			->as_object()
			->execute();

		$inst_ids = [];
		foreach ($results as $r)
		{
			$inst_id = $r->{'item_id'};
			if (array_search($inst_id, $inst_ids) === false)
			{
				$inst_ids[] = $inst_id;
			}
		}
		return $inst_ids;
	}

	/**
	 * Get all assets for this user that this user has $perm_type permission to
	 *
	 * @param int $user_id The User ID
	 * @param int $perm_type the permission type to search for (can only do one permission type at a time)
	 *
	 * @return array an array of Asset objects
	 */
	static public function get_assets_by_user($user_id, $perm_type)
	{
		$ids = Perm_Manager::get_all_objects_for_user($user_id, Perm::ASSET, [$perm_type]);
		$assets = [];
		if (count($ids) > 0)
		{
			foreach ($ids as $id)
			{
				$asset = new Widget_Asset();
				if ($asset->db_get($id))
				{
					if ($perm_type == Perm::VISIBLE)
					{
						$asset->is_shared = true;
					}
					$assets[] = $asset;
				}
			}
		}
		return $assets;
	}
	/**
	 * Returns an array with the IDs of assets in the given game
	 *
	 * @param int $inst_id the id for the game to look up assets IDs for
	 *
	 * @return array an int array of iasset IDs that belong to this particular game
	 */
	static public function get_assets_ids_by_game($inst_id)
	{
		// select all assets that belong to this game
		$results = \DB::select('a.id')
			->from(['asset',     'a'])
			->join(['map_asset_to_object', 'm'])
				->on('a.id', '=', 'm.asset_id')
				->on('m.object_type', '=', \DB::expr(\Materia\Widget_Asset::MAP_TYPE_QSET))
			->join(['widget_qset', 'q'])
				->on('q.id', '=', 'm.object_id')
			->where('q.inst_id', '=', $inst_id)
			->execute();
		// add these objects to an array
		$objects = [];
		foreach ($results as $r)
		{
			$objects[] = $r['id'];
		}
		// return the array (making sure there are no duplicate values)
		return array_unique($objects);
	}
	/**
	 * NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static protected function get_user_disk_usage($user_id)
	{
		$asset_id_list = Perm_Manager::get_all_objects_for_user($user_id, Perm::ASSET, [Perm::FULL]);
		$total_used = 0;
		if (count($asset_id_list) > 0)
		{
			foreach ($asset_id_list as $id)
			{
				$asset = new Widget_Asset();
				$asset->db_get($id);
				if (isset($asset->options['fileSize']))
				{
					if ($asset->options['fileSize'] > 0) $total_used += $asset->options['fileSize'];
				}
			}
		}
		return $total_used;
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static protected function get_user_disk_quota($user_id)
	{
		return \Config::get('materia.media_quota', 0);
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function get_user_asset_stats($user_id)
	{
		// NOTE: kbAvail is the total amount they have, not whats left of their storage
		return ['kbUsed' => floor(Widget_Asset_Manager::get_user_disk_usage($user_id) / 1024), 'kbAvail' => Widget_Asset_Manager::get_user_disk_quota($user_id) * 1024];
	}
	/**
	 * store the link of an asset ot an item
	 * the item type will be that of a group, question, or answer
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static protected function register_asset_to_item($item_type, $item_id, $id)
	{
		$asset_id = is_array($id) ? $id['id'] : $id;
		if ($asset_id === -1) return;

		\DB::query('INSERT IGNORE INTO '.\DB::quote_table('map_asset_to_object').' SET object_type = :object_type, object_id = :object_id, asset_id = :asset_id', \DB::INSERT)
				->param('object_type', $item_type)
				->param('object_id', $item_id)
				->param('asset_id', $asset_id)
				->execute();
	}
	/**
	 * similar to register_asset_to_item but takes a list of assted ids
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function register_assets_to_item($item_type, $item_id, $assets_list)
	{
		// asset List is an array
		if (count($assets_list) > 0)
		{
			foreach ($assets_list as $asset)
			{
				Widget_Asset_Manager::register_asset_to_item($item_type, $item_id, $asset);
			}
		}
		// asset list is a single asset
		elseif ($assets_list)
		{
			Widget_Asset_Manager::register_asset_to_item($item_type, $item_id, $assets_list);
		}
	}
	/**
	 * remove a link from an asset to an item
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function un_register_asset_to_item($item_type, $item_id, $id)
	{
		\DB::delete('map_asset_to_object')
			->where('type', $item_type)
			->where('object_id', $item_id)
			->where('asset_id', $id)
			->execute();
	}
	/**
	 * similar to un_register_asset_to_item but takes a list of items
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function un_register_assets_to_item($item_type, $item_id, $assets_list)
	{
		// NOTE: could change this to un register all an items assets
		// it would only be 1 sql call
		if ($assets_list)
		{
			foreach ($assets_list as $name => $value)
			{
				Widget_Asset_Manager::un_register_asset_to_item($item_type, $item_id, $value);
			}
		}
	}
	/**
	 * return a list of assetids that are used the the item of type item_type with id of item_id
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function get_assets_by_item($item_type, $item_id)
	{
		if ( ! $item_type ) return;
		if ( ! $item_id ) return;
		$results = \DB::select('asset_id')
			->from('map_asset_to_object')
			->where('object_type', $item_type)
			->where('object_id', $item_id)
			->execute()->as_array();

		return $results;
	}
}
