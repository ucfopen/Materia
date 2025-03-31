import logging

from core.models import Widget, WidgetInstance
from django.conf import settings
from django.http import HttpRequest, HttpResponseNotFound
from django.views.generic import TemplateView
from util.context_util import ContextUtil

# from util.logging.session_play import SessionPlay


logger = logging.getLogger("django")


class WidgetDetailView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug):
        return ContextUtil.create(
            title="Materia Widget Catalog",
            js_resources=settings.JS_GROUPS["detail"],
            css_resources=settings.CSS_GROUPS["detail"],
            request=self.request,
        )


class WidgetDemoView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug):
        autoplay = self.kwargs.get("autoplay", None)

        # Get demo widget instance
        widget = Widget.objects.get(pk=_get_id_from_slug(widget_slug))
        demo_id = widget.metadata_clean()["demo"]
        demo_instance = WidgetInstance.objects.get(pk=demo_id)
        if not demo_instance:
            return (
                HttpResponseNotFound()
            )  # TODO: change this into a more valid code or an error message

        return _create_player_page(
            demo_instance,
            self.request,
            is_demo=False,
            autoplay=autoplay,
            is_preview=False,
        )


class WidgetPlayView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_instance_id, instance_name=None):
        autoplay = self.kwargs.get("autoplay", None)

        # Get widget instance
        instance = WidgetInstance.objects.get(pk=widget_instance_id)
        if not instance:
            return (
                HttpResponseNotFound()
            )  # TODO: change this into a more valid code or an error message

        return _create_player_page(
            instance, self.request, is_demo=False, autoplay=autoplay, is_preview=False
        )


class WidgetPreviewView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_instance_id, instance_name=None):
        # Verify user session
        # TODO  if (\Service_User::verify_session() !== true)
        # 		{
        # 			$this->build_widget_login('Login to preview this widget', $instId);
        # 		}

        # Get widget instance
        widget_instance = WidgetInstance.objects.get(pk=widget_instance_id)
        if not widget_instance:
            return HttpResponseNotFound()

        # Check if widget is playable
        if not widget_instance.playable_by_current_user(self.request.user):
            return _create_draft_not_playable_page()

        # return _display_widget(instance=widget_instance, is_embedded=False)
        return _create_player_page(
            widget_instance, self.request, is_demo=False, autoplay=True, is_preview=True
        )


class WidgetCreatorView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug, instance_id=None):
        # Check if player user session is valid
        # TODO if (\Service_User::verify_session() !== true)
        # {
        # 	Session::set('redirect_url', URI::current());
        # 	Session::set_flash('notice', 'Please log in to create this widget.');
        # 	Response::redirect(Router::get('login').'?redirect='.URI::current());
        # }

        # Check for author permissions
        # TODO if (\Materia\Perm_Manager::does_user_have_role(['no_author'])) throw new HttpNotFoundException;

        # Create the widget instance
        widget = Widget.objects.filter(pk=_get_id_from_slug(widget_slug)).first()
        if not widget:
            return HttpResponseNotFound()

        # TODO View::set_global('me', Model_User::find_current());
        return _create_editor_page("Create Widget", widget, self.request)


class WidgetGuideView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug, guide_type):
        # Get widget
        widget = Widget.objects.filter(pk=_get_id_from_slug(widget_slug)).first()
        if widget is None:
            return HttpResponseNotFound()

        # Build page title
        title = widget.name
        guide = ""
        match guide_type:
            case "creators":
                title += " Creator's Guide"
                guide = widget.creator_guide
            case "players":
                title += " Player's Guide"
                guide = widget.player_guide
            case _:
                return HttpResponseNotFound()

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


class WidgetQsetHistoryView(TemplateView):
    template_name = "react.html"

    def get_context_data(self):
        # TODO if (\Service_User::verify_session() !== true ) throw new HttpNotFoundException;
        return ContextUtil.create(
            title="Qset Catalog",
            page_type="import",
            js_resources="dist/js/qset-history.js",
            css_resources="dist/css/qset-history.css",
            request=self.request,
        )


class WidgetQsetGenerateView(TemplateView):
    template_name = "react.html"

    def get_context_data(self):
        # TODO if (\Service_User::verify_session() !== true ) throw new HttpNotFoundException;
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
    # Create context id (?)
    # TODO call the LtiEvents/on_before_play_start_event() function. Seems to relate to LTI stuffs

    # Check to see if login is required
    if not instance.playable_by_current_user(request.user):
        return _create_widget_login_page(instance, request, is_embedded, is_preview)

    # Check to see if this widget is playable
    # TODO check status - see php
    if not is_demo and instance.is_draft:
        return _create_draft_not_playable_page(request)
    if not is_demo and not instance.widget.is_playable:
        return _create_widget_retired_page(request, is_embedded)
    if autoplay is False:
        # TODO
        pass

    # NOTE: play session creation originally occured here, in the view
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
        },
        request=request,
    )


def _create_widget_login_page(
    instance: WidgetInstance,
    request: HttpRequest,
    is_embedded: bool = False,
    is_preview: bool = False,
):
    # TODO Do some session redirect stuffs

    login_messages = _generate_widget_login_messages(instance)

    js_resources = []
    css_resources = []
    js_globals = {
        "NAME": instance.name,
        "WIDGET_NAME": instance.widget.name,
        "ICON_DIR": "",  # TODO
    }

    if login_messages["is_open"]:
        title = "Login"
        js_resources.append(settings.JS_GROUPS["login"])
        css_resources.append(settings.CSS_GROUPS["login"])

        js_globals["IS_EMBEDDED"] = is_embedded
        js_globals["ACTION_LOGIN"] = ""  # TODO fix these empty strings
        js_globals["ACTION_REDIRECT"] = ""
        js_globals["LOGIN_USER"] = ""
        js_globals["LOGIN_PW"] = ""
        js_globals["CONTEXT"] = "widget"
        js_globals["IS_PREVIEW"] = is_preview

        # Condense login links into a string with delimiters
        # TODO
        js_globals["LOGIN_LINKS"] = ""
    else:
        title = "Widget Unavailable"
        js_resources.append(settings.JS_GROUPS["closed"])
        css_resources.append(settings.JS_GROUPS["closed"])

        js_globals["IS_EMBEDDED"] = str(is_embedded)
        js_globals["SUMMARY"] = login_messages["summary"]
        js_globals["DESC"] = login_messages["desc"]

    return ContextUtil.create(
        title=title,
        js_resources=js_resources,
        css_resources=css_resources,
        js_globals=js_globals,
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


def _create_no_permission_page(request: HttpRequest):
    # TODO $this->_disable_browser_cache = true;
    return ContextUtil.create(
        title="Permission Denied",
        js_resources="dist/js/no-permission.js",
        css_resources="dist/css/no-permission.js",
        request=request,
    )


# Utils functions
def _generate_widget_login_messages(instance: WidgetInstance) -> dict:
    # TODO: get status stuffs

    return {
        "summary": "TODO Fill in this summary",
        "desc": "TODO Fill in this desc",
        "is_open": False,  # TODO
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
