import base64
import hashlib
import json

# debug logging
import logging
import os

from core.models import (
    Asset,
    LogPlay,
    Notification,
    ObjectPermission,
    UserSettings,
    Widget,
    WidgetInstance,
    WidgetMetadata,
    WidgetQset,
)
from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers
from util.logging.session_logger import SessionLogger
from util.perm_manager import PermManager

logger = logging.getLogger("django")


# Asset model serializer
class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = "__all__"


# User model serializer
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    profile_fields = serializers.SerializerMethodField()
    is_student = serializers.SerializerMethodField()

    def get_is_student(self, user):
        return PermManager.user_is_student(user)

    # remove sensitive information when requesting with non-privileged access
    def get_fields(self):
        fields = super().get_fields()
        elevated = self.context.get("elevated_access")

        if not elevated:
            for field in [
                "username",
                "email",
                "profile_fields",
                "date_joined",
                "last_login",
            ]:
                if fields[field]:
                    fields.pop(field)

        return fields

    def get_avatar(self, user):
        clean_email = user.email.strip().lower().encode("utf-8")
        hash_email = hashlib.md5(clean_email).hexdigest()
        return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"

    def get_profile_fields(self, user):
        user_profile, _ = UserSettings.objects.get_or_create(user=user)
        return user_profile.get_profile_fields()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "profile_fields",
            "date_joined",
            "last_login",
            "is_student",
        ]

        read_only_fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "date_joined",
            "last_login",
            "is_student",
        ]


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


class UserRoleSerializer(serializers.Serializer):
    id = serializers.IntegerField(max_value=None, min_value=0, required=True)
    student = serializers.BooleanField(required=False)
    author = serializers.BooleanField(required=False)
    support_user = serializers.BooleanField(required=False)

    def validate(self, data):
        if data["student"] == data["author"]:
            raise serializers.ValidationError(
                "student and author cannot be the same value."
            )
        return data


# widget engine metadata: converts the one-to-many relationship into a dict for ease of use
# not a full-blown serializer, since metadata is only accessed in the context of a widget engine
class WidgetMetadataDictField(serializers.Field):
    def to_representation(self, value):
        list_items = ["supported_data", "features", "playdata_exporters"]
        metadata_dict = {}
        for item in value.all():
            if item.name in metadata_dict:
                if not isinstance(metadata_dict[item.name], list):
                    metadata_dict[item.name] = [metadata_dict[item.name]]

                metadata_dict[item.name].append(item.value)

            else:
                if item.name in list_items:
                    metadata_dict[item.name] = [item.value]
                else:
                    metadata_dict[item.name] = item.value

        return metadata_dict

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError("metadata must be a dict!")
        return data


# Widget engine model serializer
class WidgetSerializer(serializers.ModelSerializer):
    meta_data = WidgetMetadataDictField(source="metadata", required=False)
    dir = serializers.CharField(read_only=True)

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

    def get_dir(self, widget):
        return f"{widget.id}-{widget.clean_name}{os.sep}"

    @transaction.atomic
    def update(self, widget, validated_data):
        allowed_fields = [
            "clean_name",
            "in_catalog",
            "is_editable",
            "is_scorable",
            "is_playable",
            "restrict_publish",
            "about",
            "excerpt",
            "demo",
        ]

        metadata_dict = validated_data.pop("metadata", None)

        for field, value in validated_data.items():

            if field not in allowed_fields:
                raise serializers.ValidationError(
                    f"Field not allowed to be modified: {field}"
                )

            logger.error(f"\nupdating widget field: {field}\n")
            setattr(widget, field, value)

        widget.save()

        # updating metadata requires some additional work
        # the updates affect WidgetMetadata model instances instead
        if metadata_dict:
            existing_metadata = widget.metadata.all()

            for name, value in metadata_dict.items():
                existing_metadata.filter(name=name).delete()
                WidgetMetadata.objects.create(widget=widget, name=name, value=value)

        return widget


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
    preview_url = serializers.CharField(read_only=True)
    play_url = serializers.CharField(read_only=True)
    embed_url = serializers.CharField(read_only=True, allow_null=True)
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
            "embed_url",
            "qset",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "is_student_made",
            "widget",
            "widget_id",
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


class LogSubmissionSerializer(serializers.Serializer):
    game_time = serializers.FloatField()
    item_id = serializers.UUIDField(required=False)
    type = serializers.IntegerField()
    text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    value = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # we're validating item_id as a uuid but the validated data should be a string,
    # so it behaves with downstream serialization
    def to_internal_value(self, data):
        validated_data = super().to_internal_value(data)

        if "item_id" in validated_data and validated_data["item_id"]:
            validated_data["item_id"] = str(validated_data["item_id"])

        return validated_data

    def validate(self, data):
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


# serializes and validates individual logs for a play (inbound)
class PlayLogUpdateSerializer(serializers.Serializer):
    logs = serializers.ListField()
    previewInstanceId = serializers.CharField(required=False)
    previewPlayId = serializers.UUIDField(required=False)

    def validate(self, data):
        try:
            preview_instance_id = data.get("previewInstanceId", None)
            preview_play_id = data.get("previewPlayId", None)

            # only validate session validity if it's a real play, not a preview
            if not preview_instance_id and not preview_play_id:
                play = LogPlay.objects.get(pk=self.context["session_id"])

                # if not play.is_valid or play.user.id != user.id:
                # TODO user validation, must accommodate guest mode
                if not play.is_valid:
                    raise serializers.ValidationError(
                        f"Play ID {self.context["play_id"]} invalid."
                    )

            logs = LogSubmissionSerializer(data=data["logs"], many=True)
            if logs.is_valid(raise_exception=True):
                return {
                    "logs": logs.validated_data,
                    "is_preview": preview_instance_id is not None
                    and preview_play_id is not None,
                    "preview_inst_id": preview_instance_id,
                    "preview_play_id": (
                        str(preview_play_id) if preview_play_id else None
                    ),
                }

        except LogPlay.DoesNotExist:
            raise serializers.ValidationError(
                f"Play ID {self.context["play_id"]} invalid."
            )


class PlaySessionCreateSerializer(serializers.Serializer):
    instanceId = serializers.CharField()
    is_preview = serializers.BooleanField(required=False)

    def validate(self, data):
        if data.get("is_preview", False) is True:
            raise serializers.ValidationError(
                "Invalid session creation for preview play."
            )

        instance = WidgetInstance.objects.get(pk=data["instanceId"])
        if not instance:
            raise serializers.ValidationError(
                f"Instance ID {data["InstanceId"]} invalid."
            )

        if not instance.playable_by_current_user(self.context["request"].user):
            raise serializers.ValidationError("Instance not playable by current user.")

        return {"instance": instance}


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
    widget_icon = serializers.SerializerMethodField()

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
            "widget_icon",
        ]

    def get_widget_icon(self, play):
        return f"{play.instance.widget.id}-{play.instance.widget.clean_name}{os.sep}"


# play session model; do not include user_id
class PlaySessionStudentViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogPlay
        fields = [
            "id",
            "instance",
            "is_valid",
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


# play session model; include extra info about user
class PlaySessionWithExtraUserInfoSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = LogPlay
        fields = [
            "id",
            "instance",
            "is_valid",
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
            "user",
            "user_id",
        ]


class NotificationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class ScoreSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
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
                    "id": log.semester.id,
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
                        "id": data["id"],
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
        queryset=WidgetInstance.objects.all(),
        source="instance",
        required=False,
        write_only=True,
        allow_null=True,
    )
    widget = WidgetSerializer(read_only=True)
    widget_id = serializers.PrimaryKeyRelatedField(
        queryset=Widget.objects.all(), source="widget", write_only=True
    )
    topic = serializers.CharField()
    num_questions = serializers.IntegerField()
    build_off_existing = serializers.BooleanField()


# Used for incoming requests for prompt generation. Does NOT map to a model.
class PromptGenerationRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(min_length=1, max_length=10000)


# Used for incoming requests to copy a widget instance. Does NOT map to a model.
class WidgetInstanceCopyRequestSerializer(serializers.Serializer):
    new_name = serializers.ModelField(
        model_field=WidgetInstance()._meta.get_field("name")
    )
    copy_existing_perms = serializers.BooleanField(required=False, default=False)


# Used for incoming requests to update perms. Does not map to a model.
class PermsUpdateRequestItemSerializer(serializers.Serializer):
    expiration = serializers.DateTimeField(
        required=False, allow_null=True, default=None
    )
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    perm_level = serializers.ChoiceField(
        choices=ObjectPermission.PERMISSION_CHOICES, allow_null=True
    )


class PermsUpdateRequestListSerializer(serializers.Serializer):
    updates = serializers.ListField(child=PermsUpdateRequestItemSerializer())


class ObjectPermissionSerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()

    def get_content_type(self, obj):
        return obj.content_type.model

    # TODO content_type is returning an integer value, it should give us the actual content type name?
    class Meta:
        model = ObjectPermission
        fields = ["user", "content_type", "object_id", "permission", "expires_at"]
