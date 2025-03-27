import base64
import hashlib
import json

# debug logging
import logging
import os

from core.models import (
    LogPlay,
    Notification,
    UserSettings,
    Widget,
    WidgetInstance,
    WidgetQset,
)
from django.conf import settings
from django.contrib.auth.models import User
from django.utils.text import slugify
from rest_framework import serializers
from util.logging.session_logger import SessionLogger

# from pprint import pformat
logger = logging.getLogger("django")


# User model serializer (outbound)
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    profile_fields = serializers.SerializerMethodField()

    def get_avatar(self, user):
        clean_email = user.email.strip().lower().encode("utf-8")
        hash_email = hashlib.md5(clean_email).hexdigest()
        return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"

    def get_profile_fields(self, user):
        user_profile, _ = UserSettings.objects.get_or_create(user=user)
        return user_profile.get_profile_fields()

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "avatar", "profile_fields"]


# User metadata (profile fields) serializer (inbound)
class UserMetadataSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(max_value=None, min_value=0)
    profile_fields = serializers.DictField(child=serializers.BooleanField())

    def validate(self, data):
        user = User.objects.filter(pk=data["user_id"])

        if not user:
            raise serializers.ValidationError("User ID invalid.")

        valid_keys = ["useGravatar", "notify", "darkMode", "beardMode"]

        for key, value in data["profile_fields"].items():
            if key not in valid_keys:
                raise serializers.ValidationError(
                    f"Invalid profile field provided: {key}"
                )

            # TODO is this necessary? We're already enforcing booleans via BooleanField
            if not isinstance(value, bool):
                if value.lower() in ["true", "1"]:
                    value = True
                elif value.lower() in ["false", "0"]:
                    value = False
                else:
                    raise serializers.ValidationError(
                        f"Profile field {key} must provide boolean value."
                    )

        return data["profile_fields"]


# Widget engine model serializer (outbound)
class WidgetSerializer(serializers.ModelSerializer):
    meta_data = serializers.SerializerMethodField()
    dir = serializers.SerializerMethodField()

    class Meta:
        model = Widget
        fields = [
            "id",
            "name",
            "created_at",
            "height",
            "width",
            "is_scalable",
            "score_module",
            "score_type",
            "is_qset_encrypted",
            "is_answer_encrypted",
            "is_storage_enabled",
            "is_editable",
            "is_playable",
            "is_scorable",
            "in_catalog",
            "is_generable",
            "uses_prompt_generation",
            "creator",
            "clean_name",
            "player",
            "score_screen",
            "restrict_publish",
            "creator_guide",
            "player_guide",
            "meta_data",
            "dir",
        ]

    def get_meta_data(self, widget):
        return widget.metadata_clean()

    def get_dir(self, widget):
        return f"{widget.id}-{widget.clean_name}{os.sep}"


class Base64JSONField(serializers.Field):
    def to_representation(self, value):
        # Decode base64, then decode JSON
        try:
            decoded_bytes = base64.b64decode(value)
            return json.loads(decoded_bytes.decode("utf-8"))
        except Exception as e:
            raise serializers.ValidationError(f"Error decoding JSON: {str(e)}")

    def to_internal_value(self, data):
        json_str = json.dumps(data)
        return base64.b64encode(json_str.encode("utf-8")).decode("utf-8")


# qset model serializer (inbound | outbound)
class QuestionSetSerializer(serializers.ModelSerializer):
    data = Base64JSONField()

    class Meta:
        model = WidgetQset
        fields = ["id", "instance", "created_at", "data", "version"]
        extra_kwargs = {
            "id": {"required": False, "read_only": True},
            "instance": {"required": False},
            "created_at": {"required": False, "read_only": True},
            "data": {"required": True},
            "version": {"required": True},
        }

    # helper function to recursively apply uuids to blank ids
    def apply_ids_to_questions(self, qset):
        import uuid

        def _process_item(item):

            if isinstance(item, dict):
                if "id" in item and (
                    item["id"] is None or item["id"] == 0 or item["id"] == ""
                ):
                    item["id"] = str(uuid.uuid4())

                for key, value in item.items():
                    item[key] = _process_item(value)

            elif isinstance(item, list):
                return [_process_item(i) for i in item]

            return item

        return _process_item(qset)

    def create(self, validated_data):
        if "instance" not in validated_data:
            raise serializers.ValidationError("instance required.")
        if "version" not in validated_data:
            validated_data["version"] = 1
        if "data" in validated_data:
            # despite passing data in as a dict, it's present here as a base64 blob again
            # decode it, apply ids to the dict, then re-encode it
            decoded_data = WidgetQset.decode_data(validated_data["data"])
            decoded_data = self.apply_ids_to_questions(decoded_data)
            validated_data["data"] = WidgetQset.encode_data(decoded_data)

        return super().create(validated_data)


# instance model serializer (inbound | outbound)
class WidgetInstanceSerializer(serializers.ModelSerializer):
    preview_url = serializers.SerializerMethodField()
    play_url = serializers.SerializerMethodField()
    qset = QuestionSetSerializer(required=False)

    def _handle_qset(self, qset, widget_instance):
        # handling the qset requires a couple steps:
        # the qset present in validated_data is the base64 blob. Decode it first
        # pass the dict to the serializer so ids can be populated as part of data transformation process
        # once validated, save the qset

        if qset:
            decoded_qset = WidgetQset.decode_data(qset["data"])
            qset_serializer = QuestionSetSerializer(
                data={**qset, "data": decoded_qset, "instance": widget_instance.id}
            )
            qset_serializer.is_valid(raise_exception=True)
            qset_serializer.save()

    def create(self, validated_data):
        # remove qset from data or WidgetInstance will complain the key is not present in the model (it isn't)
        qset = validated_data.pop("qset", None)
        widget_instance = super().create(validated_data)
        self._handle_qset(qset, widget_instance)
        return widget_instance

    def update(self, widget_instance, validated_data):
        qset = validated_data.pop("qset", None)
        widget_instance = super().update(widget_instance, validated_data)
        self._handle_qset(qset, widget_instance)
        return widget_instance

    widget = WidgetSerializer(read_only=True)
    widget_id = serializers.PrimaryKeyRelatedField(
        queryset=Widget.objects.all(), source="widget", write_only=True
    )
    id = serializers.CharField(
        required=False
    )  # Model's save function will auto-generate an ID if it is empty

    def get_preview_url(self, instance):
        return f"{settings.URLS["BASE_URL"]}preview/{instance.id}/{slugify(instance.name)}/"

    def get_play_url(self, instance):
        return (
            f"{settings.URLS["BASE_URL"]}play/{instance.id}/{slugify(instance.name)}/"
        )

    class Meta:
        model = WidgetInstance
        fields = [
            "id",
            "user_id",
            "name",
            "is_student_made",
            "guest_access",
            "is_draft",
            "created_at",
            "open_at",
            "close_at",
            "attempts",
            "is_deleted",
            "embedded_only",
            "widget",
            "widget_id",
            "preview_url",
            "play_url",
            "qset",
        ]


class WidgetInstanceSerializerNoIdentifyingInfo(serializers.ModelSerializer):
    preview_url = serializers.SerializerMethodField()
    play_url = serializers.SerializerMethodField()

    widget = WidgetSerializer(read_only=True)

    def get_preview_url(self, instance):
        return f"{settings.URLS["BASE_URL"]}preview/{instance.id}/{slugify(instance.name)}/"

    def get_play_url(self, instance):
        return (
            f"{settings.URLS["BASE_URL"]}play/{instance.id}/{slugify(instance.name)}/"
        )

    class Meta:
        model = WidgetInstance
        fields = [
            "id",
            "name",
            "is_student_made",
            "guest_access",
            "is_draft",
            "created_at",
            "open_at",
            "close_at",
            "attempts",
            "is_deleted",
            "embedded_only",
            "widget",
            "preview_url",
            "play_url",
        ]


class PlayIdSerializer(serializers.Serializer):
    play_id = serializers.UUIDField()

    def validate(self, data):
        play_log = LogPlay.objects.get(pk=data["play_id"])

        if not play_log:
            raise serializers.ValidationError("Play ID invalid.")

        return play_log


# serializes and validates individual logs for a play (inbound)
class PlayLogUpdateSerializer(serializers.Serializer):
    game_time = serializers.FloatField()
    item_id = serializers.UUIDField(required=False)
    type = serializers.IntegerField()
    text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    value = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        # user = self.context["request"].user
        try:
            play = LogPlay.objects.get(pk=self.context["play_id"])

            # if not play.is_valid or play.user.id != user.id:
            # TODO user validation, must accommodate guest mode
            if not play.is_valid:
                raise serializers.ValidationError(
                    f"Play ID {self.context["play_id"]} invalid."
                )

            if not isinstance(data, list):
                data = [data]

            logs = []
            for log in data:
                # TODO what if the log type is actually invalid? Right now it'll return LogType.EMPTY
                log["type"] = SessionLogger.get_log_type(log["type"])
                log["text"] = log.get("text", "")
                log["value"] = log.get("value", "")

                logs.append(log)
            return logs

        except LogPlay.DoesNotExist:
            raise serializers.ValidationError(
                f"Play ID {self.context["play_id"]} invalid."
            )


# play session model (kinda) serializer (outbound)
class PlaySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogPlay
        fields = [
            "id",
            "instance",
            "is_valid",
            "user_id",
            "is_complete",
            "score",
            "score_possible",
            "percent",
            "elapsed",
            "qset_id",
            # "environment_data",
            "auth",
            "referrer_url",
            "context_id",
            "semester_id",
            "created_at",
        ]


# play session model (kinda) with inst and widget names included (outbound)
# these include hits to other tables, so only include them if specifically needed
class PlaySessionWithExtrasSerializer(serializers.ModelSerializer):

    inst_name = serializers.CharField(source="instance.name", read_only=True)
    widget_name = serializers.CharField(source="instance.widget.name", read_only=True)

    class Meta:
        model = LogPlay
        fields = [
            "id",
            "instance",
            "is_valid",
            "user_id",
            "is_complete",
            "score",
            "score_possible",
            "percent",
            "elapsed",
            "qset_id",
            # "environment_data",
            "auth",
            "referrer_url",
            "context_id",
            "semester_id",
            "created_at",
            "inst_name",
            "widget_name",
        ]


class NotificationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class ScoreSummarySerializer(serializers.Serializer):
    term = serializers.CharField()
    year = serializers.IntegerField()
    students = serializers.IntegerField()
    average = serializers.FloatField()
    distribution = serializers.ListField()

    @classmethod
    def create_from_plays(cls, logs):

        if not logs:
            return []

        summary = {}

        for log in logs:

            semester_key = f"{log.created_at.year}-{log.semester.semester}"

            if semester_key not in summary:

                distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                for i in range(0, 10):
                    if i == (int(log.score / 10) if int(log.score / 10) < 10 else 9):
                        distribution[i] = 1
                    else:
                        distribution[i] = 0

                summary[semester_key] = {
                    "term": log.semester.semester,
                    "year": log.created_at.year,
                    "students": 1,
                    "total": log.score,
                    "distribution": distribution,
                }

            else:
                summary[semester_key]["students"] += 1
                summary[semester_key]["total"] += log.score

                summary[semester_key][distribution][
                    int(log.score / 10) if int(log.score / 10) < 10 else 9
                ] += 1

            results = []
            for data in summary.values():
                results.append(
                    {
                        "term": data["term"],
                        "year": data["year"],
                        "students": data["students"],
                        "average": round(data["total"] / data["students"], 2),
                        "distribution": data["distribution"],
                    }
                )

            return sorted(results, key=lambda x: (x["year"], x["term"]))


# Used for incoming requests for qset generation. Does NOT map to a model.
class QsetGenerationRequestSerializer(serializers.Serializer):
    instance = WidgetInstanceSerializer(read_only=True)
    instance_id = serializers.PrimaryKeyRelatedField(
        queryset=WidgetInstance.objects.all(), source="instance", required=False, write_only=True, allow_null=True
    )
    widget = WidgetSerializer(read_only=True)
    widget_id = serializers.PrimaryKeyRelatedField(queryset=Widget.objects.all(), source="widget", write_only=True)
    topic = serializers.CharField()
    num_questions = serializers.IntegerField()
    build_off_existing = serializers.BooleanField()


# Used for incoming requests for prompt generation. Does NOT map to a model.
class PromptGenerationRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(min_length=1, max_length=10000)


# Used for incoming requests to copy a widget instance. Does NOT map to a model.
class WidgetInstanceCopyRequestSerializer(serializers.Serializer):
    new_name = serializers.ModelField(model_field=WidgetInstance.name)
    copy_existing_perms = serializers.BooleanField(required=False, default=False)
