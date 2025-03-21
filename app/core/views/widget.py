from django.http import HttpResponseNotFound, HttpResponseServerError, HttpRequest
from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView
from core.models import WidgetInstance, Widget
from util.logging.session_play import SessionPlay

import logging
from pprint import pformat
logger = logging.getLogger("django")


class WidgetDetailView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug):
        context = {
            "title": "Materia Widget Catalog",
            "js_resources": settings.JS_GROUPS["detail"],
            "css_resources": settings.CSS_GROUPS["detail"],
            "js_global_variables": {
                # TODO: make these config variables, and export these to somewhere where it can be reused easily
                "BASE_URL": settings.URLS["BASE_URL"],
                "WIDGET_URL": settings.URLS["WIDGET_URL"],
                "STATIC_CROSSDOMAIN": settings.URLS["STATIC_CROSSDOMAIN"]
            },
        }
        return context


class WidgetDemoView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug):
        autoplay = self.kwargs.get('autoplay', None)

        # Get demo widget instance
        widget = Widget.objects.get(pk=_get_id_from_slug(widget_slug))
        demo_id = widget.metadata_clean()['demo']
        demo_instance = WidgetInstance.objects.get(pk=demo_id)
        if not demo_instance:
            return HttpResponseNotFound()  # TODO: change this into a more valid code or an error message

        return _create_player_page(demo_instance, self.request, is_demo=False, autoplay=autoplay, is_preview=False)


class WidgetPlayView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_instance_id, instance_name=None):
        autoplay = self.kwargs.get('autoplay', None)
        
        # Get widget instance
        instance = WidgetInstance.objects.get(pk=widget_instance_id)
        if not instance:
            return HttpResponseNotFound()  # TODO: change this into a more valid code or an error message

        return _create_player_page(instance, self.request, is_demo=False, autoplay=autoplay, is_preview=False)


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
        return _create_editor_page("Create Widget", widget)


class WidgetPreviewView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_instance_id):
        # Verify user session
        # TODO  if (\Service_User::verify_session() !== true)
        # 		{
        # 			$this->build_widget_login('Login to preview this widget', $instId);
        # 		}

        # Get widget instance
        widget_instance = WidgetInstance.objects.filter(id=widget_instance_id).first()
        if not widget_instance:
            return HttpResponseNotFound()

        # Check ownership of widget
        # TODO if ( ! Materia\Perm_Manager::user_has_any_perm_to(\Model_User::find_current_id(), $instId, Materia\Perm::INSTANCE, [Materia\Perm::FULL, Materia\Perm::VISIBLE]))
        if False:
            return _create_no_permission_page()

        # Check if widget is playable
        if not widget_instance.widget.is_playable:
            return _create_draft_not_playable_page()

        return _display_widget(instance=widget_instance, play_id=None, is_embedded=True)


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

        return {
            "title": title,
            "js_resources": ["dist/js/guides.js"],
            "css_resources": ["dist/css/guides.css"],
            "page_type": "guide",
            "js_global_variables": {
                # TODO: make these config variables, and export these to somewhere where it can be reused easily
                "BASE_URL": settings.URLS["BASE_URL"],
                "WIDGET_URL": settings.URLS["WIDGET_URL"],
                "STATIC_CROSSDOMAIN": settings.URLS["STATIC_CROSSDOMAIN"],
                "NAME": widget.name,
                "TYPE": guide_type,
                "HAS_PLAYER_GUIDE": True if widget.player_guide else False,
                "HAS_CREATOR_GUIDE": True if widget.creator_guide else False,
                "DOC_PATH": settings.URLS["WIDGET_URL"] + str(widget.id) + "-" + widget.clean_name + "/" + guide  # TODO Config::get('materia.urls.engines').$widget->dir.$guide
            }
        }


# View page creation methods

# Creates a player page for a real, logged play session
def _create_player_page(
        instance: WidgetInstance, request: HttpRequest, is_demo: bool = False, is_preview: bool = False,
        is_embedded: bool = False, autoplay: bool | None = None
):
    # Create context id (?)
    # TODO call the LtiEvents/on_before_play_start_event() function. Seems to relate to LTI stuffs

    # Check to see if login is required
    if not instance.playable_by_current_user(request.user):
        return _create_widget_login_page(instance, is_embedded, is_preview)

    # Check to see if this widget is playable
    # TODO check status - see php
    if not is_demo and instance.is_draft:
        return _create_draft_not_playable_page()
    if not is_demo and not instance.widget.is_playable:
        return _create_widget_retired_page(is_embedded)
    if autoplay is False:
        # TODO
        pass

    # Create play log
    play_id = SessionPlay().start(instance, request.user.id)
    if not play_id:
        print("Failed to create play session!")
        return HttpResponseServerError()

    # Create and return player page context
    return _display_widget(instance, play_id, is_embedded)


def _display_widget(instance: WidgetInstance, play_id: str | None = None, is_embedded: bool = False):
    return {
        "title": f"{instance.name} - {instance.widget.name}",
        "js_resources": settings.JS_GROUPS["player"],
        "css_resources": settings.CSS_GROUPS["player"],
        "html_class": "embedded" if is_embedded else "",
        "page_type": "widget",
        "js_global_variables": {
            # TODO: make these config variables, and export these to somewhere where it can be reused easily
            "BASE_URL": settings.URLS["BASE_URL"],
            "WIDGET_URL": settings.URLS["WIDGET_URL"],
            "STATIC_CROSSDOMAIN": settings.URLS["STATIC_CROSSDOMAIN"],
            "PLAY_ID": play_id,
            "DEMO_ID": instance.id,
            "WIDGET_WIDTH": instance.widget.width,
            "WIDGET_HEIGHT": instance.widget.height,
        }
    }


def _create_editor_page(title: str, widget: Widget):
    # TODO $this->_disable_browser_cache = true;

    return {
        "title": f"{title}",
        "js_resources": ["dist/js/creator-page.js"],
        "css_resources": ["dist/css/creator-page.css"],
        "js_global_variables": {
            # TODO: make these config variables, and export these to somewhere where it can be reused easily
            "BASE_URL": settings.URLS["BASE_URL"],
            "WIDGET_URL": settings.URLS["WIDGET_URL"],
            "STATIC_CROSSDOMAIN": settings.URLS["STATIC_CROSSDOMAIN"],
            "WIDGET_HEIGHT": widget.height, # TODO these are prolly supposed to be numbers, not strings
            "WIDGET_WIDTH": widget.width,
        }
    }



def _create_widget_login_page(instance: WidgetInstance, is_embedded: bool = False, is_preview: bool = False):
    # TODO Do some session redirect stuffs

    login_messages = _generate_widget_login_messages(instance)

    context = {
        "js_resources": [],
        "css_resources": [],
        "js_global_variables": {
            "NAME": instance.name,
            "WIDGET_NAME": instance.widget.name,
            "ICON_DIR": ""  # TODO
        },
    }

    if login_messages["is_open"]:
        context["title"] = "Login"
        # TODO look at the theme override stuff? see php code
        context["js_resources"].extend(settings.JS_GROUPS["login"])
        context["css_resources"].extend(settings.CSS_GROUPS["login"])

        context["js_global_variables"]["EMBEDDED"] = str(
            is_embedded)  # TODO is this supposed to be IS_EMBEDDED? also, find a way to embed as a pure boolean
        context["js_global_variables"]["ACTION_LOGIN"] = ""  # TODO fix these empty strings
        context["js_global_variables"]["ACTION_REDIRECT"] = ""
        context["js_global_variables"]["LOGIN_USER"] = ""
        context["js_global_variables"]["LOGIN_PW"] = ""
        context["js_global_variables"]["CONTEXT"] = "widget"
        context["js_global_variables"]["IS_PREVIEW"] = is_preview

        # Condense login links into a string with delimiters
        # TODO
        context["js_global_variables"]["LOGIN_LINKS"] = ""
    else:
        context["title"] = "Widget Unavailable"
        context["js_resources"].extend(settings.JS_GROUPS["closed"])
        context["css_resources"].extend(settings.CSS_GROUPS["login"])

        context["js_global_variables"]["IS_EMBEDDED"] = str(is_embedded)
        context["js_global_variables"]["SUMMARY"] = login_messages["summary"]
        context["js_global_variables"]["DESC"] = login_messages["desc"]

    return context


def _create_draft_not_playable_page():
    return {
        "title": "Draft Not Playable",
        "js_resources": settings.JS_GROUPS["draft-not-playable"],
        "css_resources": settings.CSS_GROUPS["login"],
    }


def _create_widget_retired_page(is_embedded: bool = False):
    return {
        "title": "Retired Widget",
        "js_resources": settings.JS_GROUPS["retired"],
        "css_resources": settings.CSS_GROUPS["login"],
        "js_global_variables": {
            "IS_EMBEDDED": is_embedded,
        }
    }


def _create_no_permission_page():
    # TODO $this->_disable_browser_cache = true;
    return {
        "title": "Permission Denied",
        "js_resources": ["dist/js/no-permission.js"],
        "css_resources": ["dist/css/no-permission.js"],
    }


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

    print(
        f"Failed to get id from widget slug, likely an invalid slug: '{widget_slug}'")  # TODO: proper logging (or maybe this one is just unnecessary)
    return None
