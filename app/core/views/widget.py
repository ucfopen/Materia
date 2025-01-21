from django.http import HttpResponseNotFound, HttpResponseServerError
from django.shortcuts import render
from django.views.generic import TemplateView
from core.models import WidgetInstance, Widget
from util.logging.session_play import SessionPlay


class WidgetDetailView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_slug):
        context = {
            "title": "Materia Widget Catalog",
            "js_resources": ["dist/js/detail.js"],
            "css_resources": ["dist/css/detail.css"],
            "js_global_variables": { # TODO: make these config variables, and export these to somewhere where it can be reused easily
                "BASE_URL": "http://localhost/",
                "WIDGET_URL": "http://localhost/widget/",
                "STATIC_CROSSDOMAIN": "http://localhost/",
            }
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
            return HttpResponseNotFound() # TODO: change this into a more valid code or an error message

        return _create_player_page(demo_instance, is_demo=False, autoplay=autoplay, is_preview=False)


class WidgetPlayView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, widget_instance_id, instance_name=None):
        autoplay = self.kwargs.get('autoplay', None)

        # Get widget instance
        instance = WidgetInstance.objects.get(pk=widget_instance_id)
        if not instance:
            return HttpResponseNotFound() # TODO: change this into a more valid code or an error message

        return _create_player_page(instance, is_demo=False, autoplay=autoplay, is_preview=False)


# Util methods

def _create_player_page(
    instance: WidgetInstance, is_demo: bool = False, is_preview: bool = False,
    is_embedded: bool = False, autoplay: bool | None = None
):
    # Create context id (?)
    # TODO call the LtiEvents/on_before_play_start_event() function. Seems to relate to LTI stuffs

    # Check to see if login is required
    if not instance.playable_by_current_user():
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
    play_id = SessionPlay().start(instance)
    if not play_id:
        print("Failed to create play session!")
        return HttpResponseServerError()

    # Create and return player page context
    return {
        "title": f"{instance.name} - {instance.widget.name}",
        "js_resources": ["dist/js/player-page.js"],
        "css_resources": ["dist/css/player-page.css"],
        "js_global_variables": {
            # TODO: make these config variables, and export these to somewhere where it can be reused easily
            "BASE_URL": "http://localhost/",
            "WIDGET_URL": "http://localhost/widget/",
            "STATIC_CROSSDOMAIN": "http://localhost/",
            "PLAY_ID": play_id,
            "DEMO_ID": instance.id,
            "WIDGET_WIDTH": instance.widget.width,
            "WIDGET_HEIGHT": instance.widget.height,
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
            "ICON_DIR": "" # TODO
        },
    }

    if login_messages["is_open"]:
        context["title"] = "Login"
        # TODO look at the theme override stuff? see php code
        context["js_resources"].append("dist/js/login.js")
        context["css_resources"].append("dist/css/login.css")

        context["js_global_variables"]["EMBEDDED"] = str(is_embedded) # TODO is this supposed to be IS_EMBEDDED? also, find a way to embed as a pure boolean
        context["js_global_variables"]["ACTION_LOGIN"] = "" # TODO fix these empty strings
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
        context["js_resources"].append("dist/js/closed.js")
        context["css_resources"].append("dist/css/login.css")

        context["js_global_variables"]["IS_EMBEDDED"] = str(is_embedded)
        context["js_global_variables"]["SUMMARY"] = login_messages["summary"]
        context["js_global_variables"]["DESC"] = login_messages["desc"]

    return context


def _create_draft_not_playable_page():
    return {
        "title": "Draft Not Playable",
        "js_resources": ["dist/js/draft-not-playable.js"],
        "css_resources": ["dist/css/login.css"],
    }


def _create_widget_retired_page(is_embedded: bool = False):
    return {
        "title": "Retired Widget",
        "js_resources": ["dist/js/retired.js"],
        "css_resources": ["dist/css/login.css"],
        "js_global_variables": {
            "IS_EMBEDDED": is_embedded,
        }
    }


def _generate_widget_login_messages(instance: WidgetInstance) -> dict:
    # TODO: get status stuffs

    return {
        "summary": "TODO Fill in this summary",
        "desc": "TODO Fill in this desc",
        "is_open": False, # TODO
    }


def _get_id_from_slug(widget_slug: str) -> int | None:
    split_slug = widget_slug.split("-")
    if len(split_slug) > 0:
        try:
            return int(split_slug[0])
        except Exception:
            pass

    print(f"Failed to get id from widget slug, likely an invalid slug: '{widget_slug}'") # TODO: proper logging (or maybe this one is just unnecessary)
    return None