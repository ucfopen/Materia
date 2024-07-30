import logging
import os
import shutil

from django.conf import settings

logger = logging.getLogger("django")


class FileStorageDriver:

    def get_local_file_path(id, size):
        return os.path.realpath(os.path.join(settings.DIRS["media"], f"{id}_{size}"))

    def store(asset, image_path, size):
        if not asset.is_valid():
            raise Exception("Invalid asset for storing")
        file = FileStorageDriver.get_local_file_path(asset.id, size)
        shutil.copyfile(image_path, file)
