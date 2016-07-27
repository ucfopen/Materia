Namespace('Materia').Image = do ->

	iconUrl = (widgetDir, size) ->
		if window.devicePixelRatio is 2
			WIDGET_URL+widgetDir+'img/icon-'+size+'@2x.png'
		else
			WIDGET_URL+widgetDir+'img/icon-'+size+'.png'

	screenshotUrl = (widgetDir, size) ->
			WIDGET_URL+widgetDir+'img/screen-shots/'+size+'.png'

	screenshotThumbUrl = (widgetDir, size) ->
		WIDGET_URL+widgetDir+'img/screen-shots/'+size+'-thumb.png'


	iconUrl : iconUrl
	screenshotUrl : screenshotUrl
	screenshotThumbUrl : screenshotThumbUrl
