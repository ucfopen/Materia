Namespace('Materia').Image = do ->

	iconUrl = (widgetDir, size) ->
		STATIC_URL+"develop/"+widgetDir+'_icons/icon-'+size+'.png'

	screenshotUrl = (widgetDir, size) ->
		STATIC_URL+"develop/"+widgetDir+'_screen-shots/'+size+'.png'
	
	screenshotThumbUrl = (widgetDir, size) ->
		STATIC_URL+"develop/"+widgetDir+'_screen-shots/'+size+'-thumb.png'


	iconUrl : iconUrl	
	screenshotUrl : screenshotUrl	
	screenshotThumbUrl : screenshotThumbUrl