import json
import logging

from core.mixins import (
    MateriaLoginMixin,
    MateriaLoginNeeded,
    MateriaWidgetPlayProcessor,
)
from core.models import ObjectPermission, User, Widget, WidgetInstance
from core.services.perm_service import PermService
from core.services.widget_play_services import (
    WidgetPlayInitService,
    WidgetPlayValidationService,
)
from core.utils.context_util import ContextUtil
from django.conf import settings
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.core.exceptions import BadRequest
from django.http import Http404, HttpRequest
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import TemplateView
from lti.mixins import LtiLaunchMixin
from lti.services.auth import LTIAuthService
from lti.services.launch import LTILaunchService
from lti.views.lti import error_page as lti_error_page

logger = logging.getLogger(__name__)


class WidgetDetailView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug):
        widget = Widget.objects.filter(pk=_get_id_from_slug(widget_slug)).first()
        if widget is None:
            raise Http404

        return ContextUtil.create(
            title="Widget Details",
            js_resources=settings.JS_GROUPS["detail"],
            css_resources=settings.CSS_GROUPS["detail"],
            js_globals={
                "NO_AUTHOR": PermService.does_user_have_roles(
                    self.request.user, "no_author"
                ),
                "WIDGET_HEIGHT": widget.height,
                "MEDIA_URL": settings.URLS["MEDIA_URL"],
            },
            page_type="widget",
            request=self.request,
        )


@method_decorator(never_cache, name="dispatch")
class WidgetDemoView(MateriaLoginMixin, MateriaWidgetPlayProcessor, TemplateView):
    template_name = "react.html"
    allow_all_by_default = True

    # first-in-line dispatch override for MateriaWidgetPlayProcessor
    # demo urls are formatted differently so we have to acquire demo instance id elsewhere
    def dispatch(self, request, *args, **kwargs):
        widget_slug = kwargs.get("widget_slug")
        widget = Widget.objects.get(pk=_get_id_from_slug(widget_slug))
        demo_id = widget.metadata.get("demo")
        self.instance = WidgetInstance.objects.filter(pk=demo_id).first()
        self.validation = self.get_validation(request, self.instance)

        return super().dispatch(request, *args, **kwargs)

    # override get_context_data to handle different url slugs
    # functionally no different from MateriaWidgetPlayProcessor's get_context_data
    def get_context_data(self, widget_slug):
        return super().get_context_data(None, None, False)

    def get_validation(self, request, instance):
        validation = WidgetPlayValidationService.validate_widget_context(
            request,
            instance,
            has_guest_access=True,
            is_preview=False,
            is_embedded=False,
        )

        return validation

    def process_context(self, validation):
        return _create_player_context(
            validation, self.instance, self.request, is_preview=False
        )

    def before_play_init(self, instance):
        play = WidgetPlayInitService.init_play(self.request, instance, None)

        return {"play_id": play.id, "lti_token": None}


@method_decorator(never_cache, name="dispatch")
class WidgetPlayView(
    LtiLaunchMixin, MateriaWidgetPlayProcessor, MateriaLoginMixin, TemplateView
):
    template_name = "react.html"
    # TODO revisit this flag being defaulted to True here
    # allow_all_by_default = True

    def get_validation(self, request, instance):
        context_id = ""
        launch = LTILaunchService.get_or_recover_launch(request)
        if launch is not None:
            context_id = LTILaunchService.get_context_id(launch)

        # Check if this instance is a guest/demo instance
        has_guest_access = instance.guest_access

        validation = WidgetPlayValidationService.validate_widget_context(
            request,
            instance,
            has_guest_access=has_guest_access,
            is_preview=False,
            is_embedded=self.is_embedded,
            context_id=context_id,
        )

        return validation

    def process_context(self, validation):
        return _create_player_context(
            validation,
            self.instance,
            self.request,
            is_preview=False,
            is_embedded=self.is_embedded,
        )

    def before_play_init(self, instance):

        user = None if instance.guest_access else self.request.user
        play = WidgetPlayInitService.init_play(self.request, instance, user)
        lti_token = None

        # do we have an LTI launch?
        # if it is - update the play with LTI flags and pass the token to context
        launch = LTILaunchService.get_or_recover_launch(self.request)
        if launch and not instance.guest_access:
            play.auth = "lti"
            play.context_id = LTILaunchService.get_context_id(launch)

            # if it's a first-time launch, store in session
            if LTILaunchService.get_launch_state(launch) == "INITIAL":
                LTILaunchService.store_session_launch(self.request, play.id, launch)
                lti_token = play.id
            else:
                lti_token = self.request.GET.get("token")

            play.lti_token = lti_token
            play.save()

            logger.error(
                f"LTI: session initialization for user {play.user.id} with play {play.id} in context {play.context_id}"
            )

        return {"play_id": play.id, "lti_token": lti_token}

    # overrides the baseline LTILaunchMixin's launch success method
    # validate whether we should render an actual play or another state
    def on_lti_launch_success(self, request, launch):
        inst_id = self.kwargs.get("widget_instance_id")
        instance = WidgetInstance.objects.filter(pk=inst_id).first()
        context = None

        if instance is None:
            return lti_error_page(request, "error_unknown_assignment")

        if LTIAuthService.is_user_course_author(launch):
            if instance.guest_access:
                return lti_error_page(request, "error_lti_guest_mode")
            else:
                context = _create_lti_success_page(request, instance)

        # LTI associations are registered during play view init, instead of deep linking
        # This behavior is carried over from PHP Materia
        LTILaunchService.register_association(launch, request.user, instance)

        if context:
            return render(request, "react.html", context)

        return None

    def on_lti_launch_failure(self, request):
        return lti_error_page(request)


@method_decorator(never_cache, name="dispatch")
class WidgetPreviewView(MateriaLoginMixin, MateriaWidgetPlayProcessor, TemplateView):
    template_name = "react.html"
    login_title = "Login to preview this widget"
    login_message = "Login to preview this widget"

    def get_validation(self, request, instance):
        validation = WidgetPlayValidationService.validate_widget_context(
            request,
            instance,
            has_guest_access=False,
            is_preview=True,
            is_embedded=False,
        )

        return validation

    def process_context(self, validation):
        return _create_player_context(
            validation,
            self.instance,
            self.request,
            is_preview=True,
            is_embedded=self.is_embedded,
        )

    def before_play_init(self, instance):
        preview = WidgetPlayInitService.init_preview(self.request)
        return {"play_id": preview, "lti_token": None}


@method_decorator(never_cache, name="dispatch")
class WidgetCreatorView(MateriaLoginMixin, PermissionRequiredMixin, TemplateView):
    template_name = "react.html"
    login_message = "Please log in to create this widget."
    permission_denied_message = "You do not have permission to create widgets."

    def has_permission(self):
        return not PermService.does_user_have_roles(self.request.user, "no_author")

    def get_context_data(self, widget_slug, instance_id=None):
        # Create the widget instance
        widget = Widget.objects.filter(pk=_get_id_from_slug(widget_slug)).first()
        if not widget:
            raise Http404("Could not find widget instance")

        if instance_id is not None:
            widget_instance = WidgetInstance.objects.get(id=instance_id)
            can_edit = widget_instance.editable_by_current_user(self.request.user)
            if not can_edit and not PermService.is_superuser_or_elevated(
                self.request.user
            ):
                return _create_widget_no_permission_page(self.request)

        return _create_editor_page("Create Widget", widget, self.request)


class WidgetGuideView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug, guide_type):
        # Get widget
        widget = Widget.objects.filter(pk=_get_id_from_slug(widget_slug)).first()
        if widget is None:
            raise Http404("Could not find widget instance")

        # Build page title
        title = widget.name
        match guide_type:
            case "creators":
                title += " Creator's Guide"
                guide = widget.creator_guide
            case "players":
                title += " Player's Guide"
                guide = widget.player_guide
            case _:
                raise BadRequest(f"Known guide type '{guide_type}'")

        return ContextUtil.create(
            title=title,
            js_resources=settings.JS_GROUPS["guides"],
            css_resources=settings.CSS_GROUPS["guides"],
            page_type="guide",
            js_globals={
                "NAME": widget.name,
                "TYPE": guide_type,
                "HAS_PLAYER_GUIDE": True if widget.player_guide else False,
                "HAS_CREATOR_GUIDE": True if widget.creator_guide else False,
                "DOC_PATH": settings.URLS["WIDGET_URL"]
                + str(widget.id)
                + "-"
                + widget.clean_name
                + "/"
                + guide,
            },
            request=self.request,
        )


class WidgetQsetHistoryView(MateriaLoginMixin, TemplateView):
    template_name = "react.html"

    def get_context_data(self):
        return ContextUtil.create(
            title="Qset Catalog",
            page_type="import",
            js_resources=settings.JS_GROUPS["qset-history"],
            css_resources=settings.CSS_GROUPS["qset-history"],
            request=self.request,
        )


class WidgetQsetGenerateView(MateriaLoginMixin, TemplateView):
    template_name = "react.html"

    def get_context_data(self):
        return ContextUtil.create(
            title="Qset Generation",
            page_type="generate",
            js_resources=settings.JS_GROUPS["qset-generator"],
            css_resources=settings.CSS_GROUPS["qset-generator"],
            request=self.request,
        )


# View page creation methods


# Creates a player page for a real, logged play session
def _create_player_context(
    validation: str,
    instance: WidgetInstance,
    request: HttpRequest,
    is_preview: bool = False,
    is_embedded: bool = False,
):
    # Check if embed only widget
    if validation == WidgetPlayValidationService.INVALID_EMBEDDED_ONLY:
        return _create_embedded_only_page(request, instance)

    # Check to see if login is required
    if validation == WidgetPlayValidationService.INVALID_NOT_PLAYABLE:
        raise MateriaLoginNeeded(
            login_global_vars=_create_widget_login_vars(
                instance, request, is_embedded, is_preview
            )
        )

    login_messages = []
    if validation == WidgetPlayValidationService.INVALID_NOT_YET_OPEN:
        login_messages = _generate_widget_login_messages(request.user, instance)
        return _create_widget_not_open_page(
            instance, request, login_messages, is_embedded
        )
    if validation == WidgetPlayValidationService.INVALID_DRAFT_NOT_PLAYABLE:
        return _create_draft_not_playable_page(request)
    if validation == WidgetPlayValidationService.INVALID_RETIRED_WIDGET:
        return _create_widget_retired_page(request, is_embedded)
    if validation == WidgetPlayValidationService.INVALID_NO_ATTEMPTS:
        return _create_no_attempts_page(request, instance, is_embedded)
    if validation == WidgetPlayValidationService.VALID_WITH_PRE_EMBED:
        return _create_pre_embed_placeholder_page(request, instance)

    # NOTE: play session creation originally occurred here, in the view
    # sessions are now always instantiated from the API
    # Create and return player page context
    return _display_widget(instance, request, is_embedded)


def _display_widget(
    instance: WidgetInstance,
    request: HttpRequest,
    is_embedded: bool = False,
    lti_token: str = None,
):
    return ContextUtil.create(
        title=f"{instance.name} - {instance.widget.name}",
        js_resources=settings.JS_GROUPS["player"],
        css_resources=settings.CSS_GROUPS["player"],
        html_class="embedded" if is_embedded else "",
        page_type="widget",
        js_globals={
            "DEMO_ID": instance.id,
            "WIDGET_WIDTH": instance.widget.width,
            "WIDGET_HEIGHT": instance.widget.height,
            "MEDIA_URL": settings.URLS["MEDIA_URL"],
            "LTI_TOKEN": lti_token,
        },
        request=request,
    )


def _create_editor_page(title: str, widget: Widget, request: HttpRequest):
    return ContextUtil.create(
        title=f"{title}",
        js_resources=settings.JS_GROUPS["creator"],
        css_resources=settings.CSS_GROUPS["creator"],
        js_globals={
            "WIDGET_HEIGHT": widget.height,
            "WIDGET_WIDTH": widget.width,
            "MEDIA_URL": settings.URLS["MEDIA_URL"],
        },
        request=request,
    )


# Used for creating the 'not open' page for widgets if it is closed
def _create_widget_not_open_page(
    instance: WidgetInstance,
    request: HttpRequest,
    login_messages: dict,
    is_embedded: bool = False,
):
    js_globals = {
        "NAME": instance.name,
        "WIDGET_NAME": instance.widget.name,
        "ICON_DIR": settings.URLS["WIDGET_URL"] + instance.widget.dir,
        "IS_EMBEDDED": is_embedded,
        "SUMMARY": login_messages["summary"],
        "DESC": login_messages["desc"],
        "START": login_messages["start"],
        "END": login_messages["end"],
    }

    return ContextUtil.create(
        title="Widget Unavailable",
        js_resources=settings.JS_GROUPS["closed"],
        css_resources=settings.CSS_GROUPS["login"],
        js_globals=js_globals,
        request=request,
    )


def _create_widget_login_vars(
    instance: WidgetInstance,
    request: HttpRequest,
    is_embedded: bool = False,
    is_preview: bool = False,
) -> dict:
    js_globals = {
        "NAME": instance.name,
        "WIDGET_NAME": instance.widget.name,
        "ICON_DIR": settings.URLS["WIDGET_URL"] + instance.widget.dir,
        "IS_EMBEDDED": is_embedded,
        "ACTION_LOGIN": settings.LOGIN_URL,
        "ACTION_REDIRECT": request.get_full_path(),
        "CONTEXT": "widget",
        "IS_PREVIEW": is_preview,
    }

    return js_globals


def _create_widget_no_permission_page(request: HttpRequest):
    return ContextUtil.create(
        title="No Permission",
        js_resources=settings.JS_GROUPS["no-permission"],
        css_resources=settings.CSS_GROUPS["no-permission"],
        request=request,
    )


def _create_draft_not_playable_page(request: HttpRequest):
    return ContextUtil.create(
        title="Draft Not Playable",
        js_resources=settings.JS_GROUPS["draft-not-playable"],
        css_resources=settings.CSS_GROUPS["login"],
        request=request,
    )


def _create_widget_retired_page(request: HttpRequest, is_embedded: bool = False):
    return ContextUtil.create(
        title="Retired Widget",
        js_resources=settings.JS_GROUPS["retired"],
        css_resources=settings.CSS_GROUPS["login"],
        js_globals={
            "IS_EMBEDDED": is_embedded,
        },
        request=request,
    )


def _create_no_attempts_page(
    request: HttpRequest, instance: WidgetInstance, is_embedded
):
    return ContextUtil.create(
        title="Widget Unavailable",
        page_type="login",
        js_globals={
            "ATTEMPTS": instance.attempts,
            "WIDGET_ID": instance.id,
            "IS_EMBEDDED": is_embedded,
            "NAME": instance.name,
            "ICON_DIR": settings.URLS["WIDGET_URL"] + instance.widget.dir,
        },
        js_resources=settings.JS_GROUPS["no-attempts"],
        css_resources=settings.CSS_GROUPS["login"],
        request=request,
    )


def _create_pre_embed_placeholder_page(request: HttpRequest, instance: WidgetInstance):
    return ContextUtil.create(
        title=f"{instance.name} {instance.widget.name}",
        page_type="widget",
        js_globals={
            "INST_ID": instance.id,
            "CONTEXT": "play" if "play/" in request.get_full_path() else "embed",
            "NAME": instance.name,
            "ICON_DIR": settings.URLS["WIDGET_URL"] + instance.widget.dir,
        },
        js_resources=settings.JS_GROUPS["pre-embed"],
        css_resources=settings.CSS_GROUPS["pre-embed"],
        request=request,
    )


def _create_embedded_only_page(request: HttpRequest, instance: WidgetInstance):

    return ContextUtil.create(
        title="Widget Unavailable",
        page_type="login",
        js_globals={
            "NAME": instance.name,
            "ICON_DIR": settings.URLS["WIDGET_URL"] + instance.widget.dir,
        },
        js_resources=settings.JS_GROUPS["embedded-only"],
        css_resources=settings.CSS_GROUPS["login"],
        request=request,
    )


def _create_lti_success_page(request: HttpRequest, instance: WidgetInstance):
    """
    TODO should this be under the LTI app?
    """
    is_owner = instance.permissions.filter(user=request.user).exists()
    owner_list = instance.permissions.filter(
        permission=ObjectPermission.PERMISSION_FULL
    )
    owner_details = [
        {"id": perm.user.id, "first": perm.user.first_name, "last": perm.user.last_name}
        for perm in owner_list
    ]

    return ContextUtil.create(
        title="Widget Connected Successfully",
        page_type="preview",
        js_globals={
            "INST_ID": instance.id,
            "ICON_DIR": settings.URLS["WIDGET_URL"] + instance.widget.dir,
            "PREVIEW_URL": f"/preview/{instance.id}",
            "PREVIEW_EMBED_URL": f"/preview-embed/{instance.id}",
            "CURRENT_USER_OWNS": is_owner,
            "OWNER_LIST": json.dumps(owner_details),
            "USER_ID": request.user.id,
        },
        js_resources=settings.JS_GROUPS["open-preview"],
        css_resources=settings.CSS_GROUPS["lti"],
        request=request,
    )


# Utils functions
def _generate_widget_login_messages(user: User, instance: WidgetInstance) -> dict:
    instance_availability = instance.availability_status()
    has_attempts = instance.user_has_attempts(user)

    # Build actual summary/desc messages for user.
    # Leave datetimes to be filled in by frontend (this allows them to display in their own timezone)
    if instance_availability["is_closed"]:
        summary = "Closed on {end_date}"
        desc = "This widget closed on {end_date} at {end_time} and cannot be accessed."
    elif instance_availability["is_open"] and instance_availability["will_close"]:
        summary = "Available until {end_date} at {end_time}"
        desc = ""
    elif instance_availability["will_open"] and not instance_availability["will_close"]:
        summary = "Available after {start_date} at {start_time}"
        desc = "This widget cannot be accessed at this time. Please return on or after {start_date} at {start_time}."
    elif instance_availability["will_open"] and instance_availability["will_close"]:
        summary = (
            "Available from {start_date} at {start_time} until {end_date} at {end_time}"
        )
        desc = (
            "This widget cannot be accessed at this time. Please return between {start_date} at {start_time} and "
            + "{end_date} at {end_time}"
        )
    else:
        summary = "Unknown error"
        desc = "Unknown error"

    return {
        "summary": summary,
        "desc": desc,
        "start": instance.open_at.isoformat() if instance.open_at is not None else None,
        "end": instance.close_at.isoformat() if instance.close_at is not None else None,
        "is_open": instance_availability["is_open"],
        "has_attempts": has_attempts,
    }


def _get_id_from_slug(widget_slug: str) -> int | None:
    split_slug = widget_slug.split("-")
    if len(split_slug) > 0:
        try:
            return int(split_slug[0])
        except Exception:
            pass

    logger.error(
        f"Failed to get id from widget slug, likely an invalid slug: '{widget_slug}'"
    )
    return None


def _parse_nullable_bool_string(string: str | None) -> bool | None:
    if string == "true":
        return True
    elif string == "false":
        return False
    else:
        return None
