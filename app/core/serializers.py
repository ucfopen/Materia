from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.fields import DictField

from core.models import Widget, Log, LogPlay, Notification, UserSettings, WidgetInstance, WidgetQset
import hashlib
import os

from util.logging.session_logger import SessionLogger

# debug logging
import logging
from pprint import pformat
logger = logging.getLogger("django")

# User model serializer (outbound)
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    profile_fields = serializers.SerializerMethodField()

    def get_avatar(self, user):
        clean_email = user.email.strip().lower().encode('utf-8')
        hash_email = hashlib.md5(clean_email).hexdigest()
        return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"

    def get_profile_fields(self, user):
        user_profile, _ = UserSettings.objects.get_or_create(user=user)
        return user_profile.get_profile_fields()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "profile_fields"
        ]

# User metadata (profile fields) serializer (inbound)
class UserMetadataSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(max_value=None, min_value=0)
    profile_fields = serializers.DictField(child=serializers.BooleanField())

    def validate(self, data):
        user = User.objects.filter(pk=data["user_id"])

        if not user:
            raise serializers.ValidationError("User ID invalid.")

        valid_keys = ["useGravatar","notify","darkMode","beardMode"]

        for key, value in data["profile_fields"].items():
            if key not in valid_keys:
                raise serializers.ValidationError(f"Invalid profile field provided: {key}")

            # TODO is this necessary? We're already enforcing booleans via BooleanField
            if not isinstance(value, bool):
                if value.lower() in ["true", "1"]:
                    value = True
                elif value.lower() in ["false", "0"]:
                    value = False
                else:
                    raise serializers.ValidationError(f"Profile field {key} must provide boolean value.")

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
            "dir"
        ]

    def get_meta_data(self, widget):
        return widget.metadata_clean()

    def get_dir(self, widget):
        return f"{widget.id}-{widget.clean_name}{os.sep}"


# instance model serializer (outbound)
class WidgetInstanceSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        include_qet = kwargs.pop("include_qset", False)
        super().__init__(*args, **kwargs)
        if include_qet:
            self.fields["qset"] = QuestionSetSerializer()

    def create(self, validated_data):
        if "qset" not in self.fields:
            return super().create(validated_data)

        # Handle creation with a qset to make sure qset's instance field is set correctly
        raw_qset = validated_data.pop("qset")
        widget_instance = WidgetInstance.objects.create(**validated_data)
        widget_instance.qset = raw_qset
        widget_instance.save()

        return widget_instance

    widget = WidgetSerializer(read_only=True)
    widget_id = serializers.PrimaryKeyRelatedField(queryset=Widget.objects.all(), source='widget', write_only=True)
    id = serializers.CharField(required=False)  # Model's save function will auto-generate an ID if it is empty

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
        ]


class WidgetInstanceSerializerNoIdentifyingInfo(serializers.ModelSerializer):
    widget = WidgetSerializer(read_only=True)

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
            "widget"
        ]


# qset model serializer (outbound)
class QuestionSetSerializer(serializers.ModelSerializer):
    data = serializers.DictField()  # Need to specify what type this field is, since it's only a property on the model

    class Meta:
        model = WidgetQset
        fields = [
            "id",
            "instance",
            "created_at",
            "data",
            "version"
        ]
        extra_kwargs = {
            "id": {"required": False, "read_only": True},
            "instance": {"required": False, "read_only": True},
            "created_at": {"required": False, "read_only": True},
            "data": {"required": True},
            "version": {"required": True},
        }

class PlayIdSerializer(serializers.Serializer):
    play_id = serializers.UUIDField()

    def validate(self, data):
        playLog = LogPlay.objects.get(pk=data["play_id"])

        if not playLog:
            raise serializers.ValidationError(f"Play ID invalid.")
        
        return playLog

# serializes and validates individual logs for a play (inbound)
class PlayLogUpdateSerializer(serializers.Serializer):
    game_time = serializers.FloatField()
    item_id = serializers.UUIDField(required=False)
    type = serializers.IntegerField()
    text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    value = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        user = self.context["request"].user
        try:
            play = LogPlay.objects.get(pk=self.context["play_id"])

            # if not play.is_valid or play.user.id != user.id:
            # TODO user validation, must accommodate guest mode
            if not play.is_valid:
                raise serializers.ValidationError(f"Play ID {self.context["play_id"]} invalid.")

            if not isinstance(data, list):
                data = [data]

            logs = []
            for log in data:
                log["type"] = SessionLogger.get_log_type(log["type"]) # TODO what if the log type is actually invalid? Right now it'll return LogType.EMPTY
                log["text"] = log.get("text", "")
                log["value"] = log.get("value", "")

                logs.append(log)
            return logs

        except LogPlay.DoesNotExist:
            raise serializers.ValidationError(f"Play ID {self.context["play_id"]} invalid.")

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
            "created_at"
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
            "widget_name"
        ]

class NotificationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
