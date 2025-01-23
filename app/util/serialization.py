import json

from django.core import serializers
from django.db import models
from django.db.models import QuerySet, Model


# A model containing an as_json function that will return a
# proper JSON representation of itself.
class SerializableModel(models.Model):
    def as_json(self, *select_fields):
        result = SerializationUtil.serialize(self)
        if len(select_fields) >= 1:
            result = SerializationUtil.select(result, *select_fields)

        return result

    class Meta:
        abstract = True


class SerializationUtil:
    @staticmethod
    def serialize(source: Model) -> dict:
        unprocessed_json = json.loads(serializers.serialize("json", [source]))[0]
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

        unprocessed_jsons = json.loads(serializers.serialize("json", source))
        results = []
        for unprocessed_json in unprocessed_jsons:
            processed_json = unprocessed_json["fields"]
            processed_json["id"] = unprocessed_json["pk"]
            SerializationUtil.convert_booleans(processed_json)
            results.append(processed_json)

        return results


    # Converts all booleans in a dict from their string 1/0 representation to True or False.
    # Replaces values in-place, and does not return a new dict.
    @staticmethod
    def convert_booleans(fields: dict):
        for field in fields:
            if field[:3] in ["is_", "in_"]:
                if fields[field] is True:
                    fields[field] = "1"
                if fields[field] is False:
                    fields[field] = "0"


    # Filters a dict to only include the fields specified. Analogous to performing
    # a SELECT operation on a database query.
    @staticmethod
    def select(source: dict, *fields: str) -> dict:
        result = {}
        for field in fields:
            result[field] = source[field]
        return result
