import json
import os

from django.core import serializers
from django.db.models import QuerySet


class WidgetUtil:
    # TODO this is temp
    @staticmethod
    def hack_return(raw_widgets: QuerySet) -> list:
        hack_return = []
        # this is a bit hacky - probably need to define a method/serializer on this model
        # that cleanly produces the output we need instead of doing it here
        for widget_raw in raw_widgets:
            widget_dict = json.loads(serializers.serialize("json", [widget_raw]))[0]
            widget_dict["fields"]["dir"] = f"{widget_raw.id}-{widget_raw.clean_name}{os.sep}"
            widget_dict["fields"]["id"] = widget_dict["pk"]
            widget_dict["fields"]["meta_data"] = widget_raw.metadata_clean()
            # remove this stupid hack when the frontend is willing to accept true as true instead of '1' as true
            for field in widget_dict["fields"]:
                if field[:3] in ["is_", "in_"]:
                    if widget_dict["fields"][field] is True:
                        widget_dict["fields"][field] = "1"
                    if widget_dict["fields"][field] is False:
                        widget_dict["fields"][field] = "0"

            hack_return.append(widget_dict["fields"])

        return hack_return

    @staticmethod
    def convert_booleans(fields: dict):
        for field in fields:
            if field[:3] in ["is_", "in_"]:
                if fields[field] is True:
                    fields[field] = "1"
                if fields[field] is False:
                    fields[field] = "0"