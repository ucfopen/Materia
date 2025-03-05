from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Widget, LogPlay
import hashlib
import os

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    profile_fields = serializers.SerializerMethodField()

    def get_avatar(self, user):
        clean_email = user.email.strip().lower().encode('utf-8')
        hash_email = hashlib.md5(clean_email).hexdigest()
        return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"
    
    def get_profile_fields(self, user):
        return { "useGravatar": True, "beardMode": False }

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
