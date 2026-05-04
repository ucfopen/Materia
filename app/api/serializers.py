import base64
import json

# debug logging
import logging
import os

import phpserialize
from core.models import (
    Asset,
    CommunityLibraryEntry,
    DateRange,
    LibraryReport,
    Log,
    LogPlay,
    LogStorage,
    Lti,
    Notification,
    ObjectPermission,
    UserExtraAttempts,
    UserLike,
    UserSettings,
    Widget,
    WidgetInstance,
    WidgetQset,
)
from core.services.log_storage_service import LogStorageService
from core.services.perm_service import PermService
from core.services.semester_service import SemesterService
from core.services.user_service import UserService
from core.utils.b64_util import Base64Util
from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

logger = logging.getLogger(__name__)


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
        return PermService.user_is_student(user)

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
        return UserService.get_avatar_url(user)

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
    profile_fields = serializers.DictField(child=serializers.JSONField())

    def validate(self, data):
        user = User.objects.filter(pk=data["user_id"])

        if not user:
            raise serializers.ValidationError("User ID invalid.")

        valid_keys = ["useGravatar", "notify", "theme", "beardMode"]

        for key, value in data["profile_fields"].items():
            if key not in valid_keys:
                raise serializers.ValidationError(
                    f"Invalid profile field provided: {key}"
                )
            if key == "theme" and value not in ["dark", "light", "os"]:
                raise serializers.ValidationError(
                    f"Invalid value for darkMode: {value}"
                )
            if key in ["useGravatar", "notify", "beardMode"] and not isinstance(
                value, bool
            ):
                raise serializers.ValidationError(
                    f"Invalid value for {key}, must be boolean."
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
    meta_data = serializers.JSONField(source="metadata", required=False)
    dir = serializers.CharField(read_only=True)
    creator = serializers.SerializerMethodField()
    is_generable = serializers.SerializerMethodField()
    uses_prompt_generation = serializers.SerializerMethodField()

    def get_creator(self, widget):
        """
        Checks if the widget uses the default creator - if so, returns the path for that
        Otherwise, returns the value the widget has set.
        """
        if widget.creator == "default" or widget.creator == "":
            return settings.URLS["STATIC_CROSSDOMAIN"] + "default-creator/creator.html"
        else:
            return widget.creator

    def get_is_generable(self, widget):
        """
        Returns true only if the widget supports generation AND AI features are enabled on this Materia install.
        """
        return widget.is_generable and settings.AI_GENERATION["ENABLED"]

    def get_uses_prompt_generation(self, widget):
        """
        Returns true only if the widget supports prompt generation AND AI features are enabled on this Materia install.
        """
        return widget.uses_prompt_generation and settings.AI_GENERATION["ENABLED"]

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
            "featured",
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
            "featured",
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

            logger.info("updating widget field: %s", field)
            setattr(widget, field, value)

        if metadata_dict:
            for name, value in metadata_dict.items():
                widget.metadata[name] = value

        widget.save()

        return widget


class Base64JSONField(serializers.Field):
    def to_representation(self, value):
        # Decode base64, then decode JSON
        try:
            decoded_bytes = base64.b64decode(value)
            return json.loads(decoded_bytes.decode("utf-8"))
        except Exception as e:
            raise serializers.ValidationError(
                f"Error decoding JSON in Base64JSONField Serializer: {str(e)}"
            )

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

    def create(self, validated_data):
        if "instance" not in validated_data:
            raise serializers.ValidationError("instance required.")
        if "version" not in validated_data:
            validated_data["version"] = 1
        if "data" not in validated_data:
            validated_data["data"] = {}

        # previous widget preprocessing steps (applying IDs and creating questions)
        # are now performed in the WidgetQset model's save method
        widget_qset = super().create(validated_data)

        return widget_qset


# instance model serializer (inbound | outbound)
class WidgetInstanceSerializer(serializers.ModelSerializer):
    preview_url = serializers.CharField(read_only=True)
    play_url = serializers.CharField(read_only=True)
    embed_url = serializers.CharField(read_only=True, allow_null=True)
    is_embedded = serializers.BooleanField(read_only=True)
    qset = QuestionSetSerializer(required=False)
    copied_from_entry_id = serializers.SerializerMethodField()

    def get_copied_from_entry_id(self, instance):
        entry = instance.copied_from_entry
        if entry and entry.instance.is_shared:
            return entry.id
        return None

    # remove sensitive info if context flag set
    def get_fields(self):
        fields = super().get_fields()
        hide_identifying_info = self.context.get("hide_identifying_info", True)

        if hide_identifying_info:
            for field in [
                "user_id",
            ]:
                if fields[field]:
                    fields.pop(field)

        return fields

    def _handle_qset(self, qset, widget_instance):
        # handling the qset requires a couple steps:
        # the qset present in validated_data is the base64 blob. Decode it first
        # pass the dict to the serializer so ids can be populated as part of data transformation process
        # once validated, save the qset

        if qset:
            decoded_qset = Base64Util.decode(qset["data"])
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
    library_entry = serializers.SerializerMethodField()

    def get_library_entry(self, instance):
        entry = CommunityLibraryEntry.objects.filter(instance=instance).first()
        if entry is None:
            return None
        return {
            "id": entry.id,
            "category": entry.category,
            "category_display": entry.get_category_display(),
            "course_level": entry.course_level,
            "course_level_display": entry.get_course_level_display(),
            "featured": entry.featured,
            "is_banned": entry.is_banned,
            "report_count": entry.report_count,
            "copy_count": entry.copy_count,
            "like_count": entry.like_count,
        }

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
            "is_shared",
            "copied_from_entry_id",
            "library_entry",
            "widget",
            "widget_id",
            "preview_url",
            "play_url",
            "embed_url",
            "is_embedded",
            "qset",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "is_student_made",
            "copied_from_entry_id",
            "widget",
            "widget_id",
            "is_embedded",
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
    item_id = serializers.CharField(required=False)
    type = serializers.IntegerField()
    text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    value = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # we're validating item_id as a uuid but the validated data should be a string,
    # so it behaves with downstream serialization
    def to_internal_value(self, data):
        validated_data = super().to_internal_value(data)

        if "item_id" in validated_data and validated_data["item_id"]:
            validated_data["item_id"] = str(validated_data["item_id"])
            validated_data["type"] = Log.LogType.get_log_type(validated_data["type"])
            validated_data["text"] = validated_data.get("text", "")
            validated_data["value"] = validated_data.get("value") or ""

        return validated_data


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

                # TODO user validation, must accommodate guest mode
                if not play.is_valid:
                    raise serializers.ValidationError(f"Play ID {play.id} invalid.")

            logs = LogSubmissionSerializer(data=data["logs"], many=True)
            if logs.is_valid():
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
        is_preview = data.get("is_preview", False)
        try:
            instance = WidgetInstance.objects.get(pk=data["instanceId"])
        except WidgetInstance.DoesNotExist:
            raise serializers.ValidationError(
                f"Instance ID {data["instanceId"]} invalid."
            )

        if not instance.playable_by_current_user(self.context["request"].user):
            raise serializers.ValidationError("Instance not playable by current user.")
        return {"instance": instance, "is_preview": is_preview}


# play session model (kinda) serializer (outbound)
class PlaySessionSerializer(serializers.ModelSerializer):
    inst_name = serializers.CharField(source="instance.name", read_only=True)
    widget_name = serializers.CharField(source="instance.widget.name", read_only=True)
    widget_icon = serializers.SerializerMethodField()
    submission_status = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)

    def get_widget_icon(self, play):
        return f"{play.instance.widget.id}-{play.instance.widget.clean_name}{os.sep}"

    def get_submission_status(self, play):
        # Return the submission_status from the related LtiPlayState
        if hasattr(play, "lti_play_state"):
            return play.lti_play_state.submission_status
        return None

    def __init__(self, *args, **kwargs):
        is_student_view = kwargs.pop("is_student_view", False)
        include_user_info = kwargs.pop("include_user_info", False)
        include_activity = kwargs.pop(
            "include_activity", kwargs.pop("admin_activity", False)
        )

        super().__init__(*args, **kwargs)

        field_set = [
            "id",
            "instance",
            "is_valid",
            "is_complete",
            "score",
            "score_possible",
            "percent",
            "elapsed",
            "qset_id",
            "auth",
            "referrer_url",
            "context_id",
            "semester_id",
            "created_at",
        ]

        if not is_student_view:
            field_set.append("user_id")

        if include_activity:
            field_set.extend(
                ["inst_name", "widget_name", "widget_icon", "submission_status"]
            )

        if include_user_info:
            field_set.append("user")

        allowed = set(field_set)
        existing = set(self.fields)
        for field_name in existing - allowed:
            self.fields.pop(field_name)

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
            "auth",
            "referrer_url",
            "context_id",
            "semester_id",
            "created_at",
            "inst_name",
            "widget_name",
            "widget_icon",
            "submission_status",
            "user",
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
    storage = serializers.BooleanField()

    @classmethod
    def create_from_plays(cls, logs, include_storage=False):

        if not logs:
            return []

        summary = {}
        storage_by_semester = {}
        unique_students = {}

        for log in logs:

            semester_key = f"{log.created_at.year}-{log.semester.semester}"
            user_id = 0 if log.user_id is None else log.user_id

            if semester_key not in summary:

                distribution = []

                if log.is_complete:

                    # one index per grade range in order:
                    # '0-9', '10-19', '20-29', '30-39', '40-49',
                    # '50-59', '60-69', '70-79', '80-89', '90-100'
                    distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                    for i in range(0, 10):
                        if i == (
                            int(log.percent / 10) if int(log.percent / 10) < 10 else 9
                        ):
                            distribution[i] = 1
                        else:
                            distribution[i] = 0

                unique_students[semester_key] = [user_id]

                if include_storage and semester_key not in storage_by_semester:
                    storage_by_semester[semester_key] = log.storage_logs.exists()
                else:
                    storage_by_semester[semester_key] = False

                summary[semester_key] = {
                    "id": log.semester.id,
                    "term": log.semester.semester,
                    "year": log.created_at.year,
                    "students": 1,
                    "count": 1,
                    "total": log.percent,
                    "distribution": distribution,
                }

            else:

                if user_id not in unique_students[semester_key]:
                    unique_students[semester_key].append(user_id)
                    summary[semester_key]["students"] += 1

                summary[semester_key]["count"] += 1
                summary[semester_key]["total"] += log.percent

                if log.is_complete:

                    # check to see if the distribution has been provisioned in cases where
                    # the semester key is already present
                    if len(summary[semester_key]["distribution"]) == 0:

                        # init the distribution list, equivalent to what's being done on L624
                        summary[semester_key]["distribution"] = [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                        ]

                    summary[semester_key]["distribution"][
                        int(log.percent / 10) if int(log.percent / 10) < 10 else 9
                    ] += 1

                if (
                    include_storage
                    and storage_by_semester[semester_key] is not True
                    and log.storage_logs.exists()
                ):
                    storage_by_semester[semester_key] = True

        results = []
        for data in summary.values():
            results.append(
                {
                    "id": data["id"],
                    "term": data["term"],
                    "year": data["year"],
                    "students": data["students"],
                    "average": round(data["total"] / data["count"], 2),
                    "distribution": data["distribution"],
                    "storage": storage_by_semester[f"{data["year"]}-{data["term"]}"],
                }
            )

        return sorted(results, key=lambda x: (x["year"], x["term"]), reverse=True)


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
    has_contexts = serializers.BooleanField()


class PermsUpdateRequestListSerializer(serializers.Serializer):
    updates = serializers.ListField(child=PermsUpdateRequestItemSerializer())


class ObjectPermissionSerializer(serializers.Serializer):
    user = serializers.IntegerField()
    content_type = serializers.CharField()
    object_id = serializers.CharField()
    permission = serializers.CharField()
    expires_at = serializers.DateTimeField(allow_null=True)
    context_ids = serializers.ListField(child=serializers.CharField(allow_null=True))

    @classmethod
    def from_queryset(cls, queryset):
        """
        Converts a queryset of ObjectPermission instances into grouped, serialized representations.
        Each unique combination of (user, content_type, object_id, permission) is returned
        as a single item with context_ids as a list.
        """
        grouped = {}

        for perm in queryset:
            key = (
                perm.user.id,
                perm.content_type.model,
                perm.object_id,
                perm.permission,
                perm.expires_at,
            )

            if key not in grouped:
                grouped[key] = {
                    "user": perm.user.id,
                    "content_type": perm.content_type.model,
                    "object_id": perm.object_id,
                    "permission": perm.permission,
                    "expires_at": perm.expires_at,
                    "context_ids": [],
                }

            grouped[key]["context_ids"].append(perm.context_id)

        # Serialize and validate the grouped data
        serializer = cls(data=list(grouped.values()), many=True)
        serializer.is_valid(raise_exception=True)
        return serializer.data


class ScoresForUserSerializer(serializers.Serializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=True
    )
    inst_id = serializers.PrimaryKeyRelatedField(
        queryset=WidgetInstance.objects.all(), required=True
    )
    context = serializers.CharField(required=False)


class ScoreDetailsForPlaySerializer(serializers.Serializer):
    play_id = serializers.PrimaryKeyRelatedField(
        queryset=LogPlay.objects.select_related("lti_play_state"), required=True
    )


class ScoreDetailsForPreviewSerializer(serializers.Serializer):
    preview_inst_id = serializers.PrimaryKeyRelatedField(
        queryset=WidgetInstance.objects.all(), required=True
    )
    play_id = serializers.UUIDField()


class LtiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lti
        fields = [
            "widget_instance",
            "resource_link",
            "lti_version",
            "name",
            "context_id",
            "context_title",
        ]


class UserExtraAttemptsSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    semester = serializers.PrimaryKeyRelatedField(
        queryset=DateRange.objects.all(),
        default=lambda: SemesterService.get_current_semester(),
    )
    context_id = serializers.CharField(allow_blank=True, required=False, default="")

    class Meta:
        model = UserExtraAttempts
        fields = "__all__"


class PlayStorageSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField()

    class Meta:
        model = LogStorage
        fields = "__all__"

    def get_data(self, storage_log):
        raw = base64.b64decode(storage_log.data)
        try:
            data = phpserialize.loads(raw, decode_strings=True)
        except ValueError:
            data = json.loads(raw)
        return dict(sorted(data.items()))


class PlayStorageTableSerializer(serializers.Serializer):

    def to_representation(self, queryset):
        anonymize = self.context.get("anonymize", False)
        return LogStorageService.build_log_tables_from_queryset(queryset, anonymize)


class PlayStorageSaveSerializer(serializers.Serializer):
    play_id = serializers.PrimaryKeyRelatedField(
        queryset=LogPlay.objects.all(), required=True
    )
    logs = serializers.JSONField()


class CommunityLibraryEntrySerializer(serializers.ModelSerializer):
    instance_id = serializers.CharField(source="instance.id", read_only=True)
    instance_name = serializers.SerializerMethodField()
    widget = WidgetSerializer(source="instance.widget", read_only=True)
    owner_display_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    course_level_display = serializers.CharField(
        source="get_course_level_display", read_only=True
    )
    latest_snapshot_id = serializers.SerializerMethodField()
    user_has_liked = serializers.SerializerMethodField()
    last_reported_at = serializers.SerializerMethodField()

    class Meta:
        model = CommunityLibraryEntry
        fields = [
            "id",
            "instance_id",
            "instance_name",
            "widget",
            "owner_display_name",
            "category",
            "category_display",
            "course_level",
            "course_level_display",
            "featured",
            "copy_count",
            "like_count",
            "report_count",
            "is_banned",
            "latest_snapshot_id",
            "user_has_liked",
            "created_at",
            "last_reported_at",
        ]

    def get_instance_name(self, entry):
        snapshot = entry.snapshots.order_by("-created_at").first()
        return snapshot.name

    def get_latest_snapshot_id(self, entry):
        snapshot = entry.snapshots.order_by("-created_at").first()
        return snapshot.id

    def get_owner_display_name(self, entry):
        user = entry.instance.user
        first = user.first_name or ""
        last = user.last_name or ""
        return f"{first} {last}".strip()

    def get_last_reported_at(self, entry):
        latest_report = entry.reports.order_by("-created_at").first()
        return latest_report.created_at if latest_report else None

    def get_user_has_liked(self, entry):
        request = self.context.get("request")
        return UserLike.objects.filter(user=request.user, entry=entry).exists()


class LibraryReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryReport
        fields = ["reason", "details"]


class PublishToLibrarySerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=CommunityLibraryEntry.CATEGORY_CHOICES)
    course_level = serializers.ChoiceField(
        choices=[("", "")] + CommunityLibraryEntry.COURSE_LEVEL_CHOICES,
        required=False,
        default="",
    )
