from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Widget, LogPlay, UserSettings, WidgetInstance, WidgetQset
import hashlib
import os

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
    class Meta:
        model = WidgetInstance
        fields = "__all__"

# qset model serializer (outbound)
class QuestionSetSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField()
    class Meta:
        model = WidgetQset
        fields = [
            "id",
            "instance",
            "created_at",
            "data",
            "version"
        ]

    def get_data(self, qset):
        return qset.as_json()

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
