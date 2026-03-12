import json
import os

from django.conf import settings


class AssetManifest:
    _manifest = None

    @classmethod
    def _load_manifest(cls):
        manifest_path = os.path.join(str(settings.APP_PATH), "public", "manifest.json")
        try:
            with open(manifest_path) as f:
                cls._manifest = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            cls._manifest = {}

    @classmethod
    def resolve(cls, path):
        if cls._manifest is None:
            cls._load_manifest()
        return cls._manifest.get(path, path)
