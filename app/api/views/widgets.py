from django.conf import settings
from django.contrib.auth.decorators import login_required, permission_required
from django.core import serializers
from django.http import JsonResponse, HttpResponseServerError

from core.models import Widget, WidgetMetadata

import json

import logging
logger = logging.getLogger('django')

class WidgetsApi:
    def by_type(request):
        widget_type = request.GET.get('type') or 'default'

        all_widgets = Widget.objects.all().order_by('name')
        if widget_type == 'admin':
            pass
        elif widget_type in ['all', 'playable']:
            all_widgets = all_widgets.filter(is_playable=True)
        elif widget_type in ['featured', 'catalog', 'default']:
            all_widgets = all_widgets.filter(in_catalog=True, is_playable=True)

        hack_return = []
        # this is a bit hacky - probably need to define a method/serializer on this model
        #  that cleanly produces the output we need instead of doing it here
        for widget_raw in all_widgets:
            widget_dict = json.loads(serializers.serialize('json', [widget_raw]))[0]
            widget_dict['fields']['id'] = widget_dict['pk']
            widget_dict['fields']['meta_data'] = widget_raw.metadata_clean()
            # remove this stupid hack when the frontend is willing to accept true as true instead of '1' as true
            for field in widget_dict['fields']:
                if field[:3] in ['is_', 'in_']:
                    if widget_dict['fields'][field] == True: widget_dict['fields'][field] = "1"
                    if widget_dict['fields'][field] == False: widget_dict['fields'][field] = "0"

            hack_return.append(widget_dict['fields'])

        return JsonResponse(hack_return, safe=False)
