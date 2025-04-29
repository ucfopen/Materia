import logging

from django.contrib.auth.mixins import PermissionRequiredMixin
from django.core.exceptions import BadRequest

from core.mixins import MateriaLoginMixin, MateriaLoginNeeded, MateriaLoginByExceptionMixin
from core.models import Widget, WidgetInstance
from django.conf import settings
from django.http import HttpRequest, Http404
from django.views.generic import TemplateView
from util.context_util import ContextUtil
from util.perm_manager import PermManager


logger = logging.getLogger("django")


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
                "NO_AUTHOR": PermManager.does_user_have_roles(self.request.user, "no_author"),
                "WIDGET_HEIGHT": widget.height,
            },
            page_type="widget",
            request=self.request,
        )


class WidgetDemoView(MateriaLoginByExceptionMixin, TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug):
        autoplay = _parse_nullable_bool_string(self.request.GET.get("autoplay", None))

        # Get demo widget instance
        widget = Widget.objects.get(pk=_get_id_from_slug(widget_slug))
        demo_id = widget.metadata_clean().get("demo")
        demo_instance = WidgetInstance.objects.filter(pk=demo_id).first()
        if not demo_instance:
            raise Http404("Could not find widget demo instance")

        return _create_player_page(
            demo_instance,
            self.request,
            is_demo=True,
            autoplay=autoplay,
            is_preview=False,
        )


class WidgetPlayView(MateriaLoginByExceptionMixin, TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_instance_id, instance_name=None):
        autoplay = _parse_nullable_bool_string(self.request.GET.get("autoplay", None))

        # Get widget instance
        instance = WidgetInstance.objects.filter(pk=widget_instance_id).first()
        if instance is None:
            raise Http404("Could not find widget instance")

        return _create_player_page(
            instance, self.request, is_demo=False, autoplay=autoplay, is_preview=False
        )


class WidgetPreviewView(MateriaLoginMixin, TemplateView):
    template_name = "react.html"
    login_title = "Login to preview this widget"
    login_message = "Login to preview this widget"

    def get_context_data(self, widget_instance_id, instance_name=None):
        # Get widget instance
        widget_instance = WidgetInstance.objects.get(pk=widget_instance_id)
        if not widget_instance:
            raise Http404("Could not find widget instance")

        # Check if widget is playable
        if not widget_instance.playable_by_current_user(self.request.user):
            return _create_draft_not_playable_page(request=self.request)

        # return _display_widget(instance=widget_instance, is_embedded=False)
        return _create_player_page(
            widget_instance, self.request, is_demo=False, autoplay=True, is_preview=True
        )


class WidgetCreatorView(MateriaLoginMixin, PermissionRequiredMixin, TemplateView):
    template_name = "react.html"
    login_message = "Please log in to create this widget."
    permission_denied_message = "You do not have permission to create widgets."

    def has_permission(self):
        return not PermManager.does_user_have_roles(self.request.user, 'no_author')

    def get_context_data(self, widget_slug, instance_id=None):
        # Create the widget instance
        widget = Widget.objects.filter(pk=_get_id_from_slug(widget_slug)).first()
        if not widget:
            raise Http404("Could not find widget instance")

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
            js_resources="dist/js/guides.js",
            css_resources="dist/css/guides.css",
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
            js_resources="dist/js/qset-history.js",
            css_resources="dist/css/qset-history.css",
            request=self.request,
        )


class WidgetQsetGenerateView(MateriaLoginMixin, TemplateView):
    template_name = "react.html"

    def get_context_data(self):
        return ContextUtil.create(
            title="Qset Generation",
            page_type="generate",
            js_resources="dist/js/qset-generator.js",
            css_resources="dist/css/qset-generator.css",
            request=self.request,
        )


# View page creation methods


# Creates a player page for a real, logged play session
def _create_player_page(
    instance: WidgetInstance,
    request: HttpRequest,
    is_demo: bool = False,
    is_preview: bool = False,
    is_embedded: bool = False,
    autoplay: bool | None = None,
):
    # TODO call the LtiEvents/on_before_play_start_event() function. Seems to relate to LTI stuffs
    context_id = None  # TODO ^

    # Check if embed only widget
    if not is_embedded and instance.embedded_only:
        return _create_embedded_only_page(request, instance)

    # Check to see if login is required
    if not instance.playable_by_current_user(request.user):
        raise MateriaLoginNeeded(login_global_vars=_create_widget_login_vars(
            instance, request, is_embedded, is_preview
        ))

    # Check to see if this widget is playable
    instance_status = instance.status(context_id)

    if not instance_status["is_open"]:
        return _create_widget_login_page(instance, request, is_embedded, is_preview)  # TODO
    if not is_preview and instance.is_draft:
        return _create_draft_not_playable_page(request)
    if not is_demo and not instance.widget.is_playable:
        return _create_widget_retired_page(request, is_embedded)
    if not instance_status["has_attempts"]:
        return _create_no_attempts_page(request, instance, is_embedded)
    if autoplay is not None and autoplay is False:
        return _create_pre_embed_placeholder_page(request, instance)

    # NOTE: play session creation originally occurred here, in the view
    # sessions are now always instantiated from the API
    # Create and return player page context
    return _display_widget(instance, request, is_embedded)


def _display_widget(
    instance: WidgetInstance, request: HttpRequest, is_embedded: bool = False
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
        },
        request=request,
    )


def _create_editor_page(title: str, widget: Widget, request: HttpRequest):
    # TODO $this->_disable_browser_cache = true;

    return ContextUtil.create(
        title=f"{title}",
        js_resources="dist/js/creator-page.js",
        css_resources="dist/css/creator-page.css",
        js_globals={
            "WIDGET_HEIGHT": widget.height,
            "WIDGET_WIDTH": widget.width,
            "MEDIA_URL": settings.URLS["MEDIA_URL"],
        },
        request=request,
    )


# Used for creating special login pages conditionally, if a widget is found to be restricted
def _create_widget_login_page(
    instance: WidgetInstance,
    request: HttpRequest,
    is_embedded: bool = False,
    is_preview: bool = False,
):
    login_messages = _generate_widget_login_messages(instance)

    js_resources = []
    css_resources = []
    js_globals = {
        "NAME": instance.name,
        "WIDGET_NAME": instance.widget.name,
        "ICON_DIR": settings.URLS["WIDGET_URL"] + instance.widget.dir
    }

    if login_messages["is_open"]:
        title = "Login"
        js_resources.append(*settings.JS_GROUPS["login"])
        css_resources.append(*settings.CSS_GROUPS["login"])

        js_globals["IS_EMBEDDED"] = is_embedded
        js_globals["ACTION_LOGIN"] = settings.LOGIN_URL
        js_globals["ACTION_REDIRECT"] = request.get_full_path()
        js_globals["LOGIN_USER"] = settings.VERBAGE["USERNAME"]
        js_globals["LOGIN_PW"] = settings.VERBAGE["PASSWORD"]
        js_globals["CONTEXT"] = "widget"
        js_globals["IS_PREVIEW"] = is_preview

        # Condense login links into a string with delimiters
        link_items = []
        for link in settings.LOGIN_LINKS:
            link_items.append(f"{link["href"]}***{link["title"]}")
        js_globals["LOGIN_LINKS"] = "@@@".join(link_items)
    else:
        title = "Widget Unavailable"
        js_resources.append(*settings.JS_GROUPS["closed"])
        css_resources.append(*settings.CSS_GROUPS["login"])

        js_globals["IS_EMBEDDED"] = is_embedded
        js_globals["SUMMARY"] = login_messages["summary"]
        js_globals["DESC"] = login_messages["desc"]
        js_globals["START"] = login_messages["start"]
        js_globals["END"] = login_messages["end"]

    return ContextUtil.create(
        title=title,
        js_resources=js_resources,
        css_resources=css_resources,
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
        "LOGIN_USER": settings.VERBAGE["USERNAME"],
        "LOGIN_PW": settings.VERBAGE["PASSWORD"],
        "CONTEXT": "widget",
        "IS_PREVIEW": is_preview
    }

    # Condense login links into a string with delimiters
    link_items = []
    for link in settings.LOGIN_LINKS:
        link_items.append(f"{link["href"]}***{link["title"]}")
    js_globals["LOGIN_LINKS"] = "@@@".join(link_items)

    return js_globals


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


def _create_no_attempts_page(request: HttpRequest, instance: WidgetInstance, is_embedded):
    # TODO _disable_browser_cache = true

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
    # TODO _disable_browser_cache = true

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
    # TODO 'before_embedded_only' event trigger occurred here

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


# Utils functions
def _generate_widget_login_messages(instance: WidgetInstance) -> dict:
    instance_status = instance.status()

    # Build actual summary/desc messages for user.
    # Leave datetimes to be filled in by frontend (this allows them to display in their own timezone)
    if instance_status["is_closed"]:
        summary = "Closed on {end_date}"
        desc = "This widget closed on {end_date} at {end_time} and cannot be accessed."
    elif instance_status["is_open"] and instance_status["will_close"]:
        summary = "Available until {end_date} at {end_time}"
        desc = ""
    elif instance_status["will_open"] and not instance_status["will_close"]:
        summary = "Available after {start_date} at {start_time}"
        desc = "This widget cannot be accessed at this time. Please return on or after {start_date} at {start_time}."
    elif instance_status["will_open"] and instance_status["will_close"]:
        summary = "Available from {start_date} at {start_time} until {end_date} at {end_time}"
        desc = ("This widget cannot be accessed at this time. Please return between {start_date} at {start_time} and "
                + "{end_date} at {end_time}")
    else:
        summary = "Unknown error"
        desc = "Unknown error"

    return {
        "summary": summary,
        "desc": desc,
        "start": instance.open_at.isoformat() if instance.open_at is not None else None,
        "end": instance.close_at.isoformat() if instance.close_at is not None else None,
        "is_open": instance_status["is_open"],
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
