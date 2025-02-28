import json

from django.core import serializers
from django.db import models
from django.db.models import QuerySet, Model


# A model containing an as_json function that will return a
# proper JSON representation of itself.
class SerializableModel(models.Model):
    def as_dict(self, select_fields: list[str] = None, serialize_fks: list[str] = None) -> dict:
        if serialize_fks is None:
            serialize_fks = []

        result = SerializationUtil.serialize(self, select_fields)

        # if len(select_fields) >= 1:
        #     result = SerializationUtil.select(result, *select_fields)

        for foreign_key in serialize_fks:
            serialized_fk = getattr(self, foreign_key).as_dict()
            result[foreign_key] = serialized_fk

        return result

    class Meta:
        abstract = True


class SerializationUtil:
    @staticmethod
    def serialize(source: Model, select: list[str] | None = None) -> dict:
        # TODO serialize the foreign keys
        if select is None:
            unprocessed_json = json.loads(serializers.serialize("json", [source]))[0]
        else:
            unprocessed_json = json.loads(serializers.serialize("json", [source], fields=select))[0]
        result = unprocessed_json["fields"]
        result["id"] = unprocessed_json["pk"]
        SerializationUtil.convert_booleans(result)

        return result

    @staticmethod
    def serialize_set(source: QuerySet) -> list[dict]:
        # Set is made up of dicts rather than models (as is done when .values() is used)
        # Just return those dicts instead, they are already 'json'
        # TODO though some fields, like datetimes, still might need manual serialization
        if isinstance(source[0], dict):
            results = [d for d in source]
            return results

        results = []
        for item in source:
            if hasattr(item, "as_dict"):
                results.append(item.as_dict())
            else:
                results.append(SerializationUtil.serialize(item))

        return results

    # Converts all booleans in a dict from their string 1/0 representation to True or False.
    # Replaces values in-place, and does not return a new dict.
    @staticmethod
    def convert_booleans(fields: dict):
        for field in fields:
            if field[:3] in ["is_", "in_"]:
                if fields[field] == "1":
                    fields[field] = True
                if fields[field] is "0":
                    fields[field] = False

    # Filters a dict to only include the fields specified. Analogous to performing
    # a SELECT operation on a database query.
    @staticmethod
    def select(source: dict, *fields: str) -> dict:
        result = {}
        for field in fields:
            result[field] = source[field]
        return result
