class AssetManager:
    def update_asset(asset_id, properties=[]):
        pass

    # TODO: re-implement this later
    def user_has_space_for(bytes):
        return True

    # old method for server upload storage
    # differences from PHP - including file path separate from file info
    #  as those data points are not part of the same source, also allowing
    #  for a user to be provided if this is called from a media upload action
    def new_asset_from_file(name, file_info, file_path, user=None):
        import os

        import magic
        from core.models import Asset
        from util.widget.validator import ValidatorUtil

        # does this user still have storage space left?
        if not AssetManager.user_has_space_for(file_info.st_size):
            return False

        mime_type = magic.from_file(file_path, mime=True)
        extension = Asset.get_type_from_mime_type(mime_type)
        if not bool(extension):
            return False

        # create and store the asset
        asset = Asset()
        asset.file_type = extension
        asset.title = name
        asset.file_size = file_info.st_size

        # try to save the asset and move it
        if asset.db_store(user) and ValidatorUtil.is_valid_hash(asset.id):
            try:
                # copy the file to its permanent home with an appropriate name
                asset.upload_asset_data(file_path)
                # remove the original
                os.remove(file_path)

                # make sure the user doing this has permissions to the new file, if applicable
                # TODO: do this
                if user:
                    pass
                return asset
            except Exception:
                pass

            # something failed in the above block, remove the asset
            asset.db_remove()

        return asset
