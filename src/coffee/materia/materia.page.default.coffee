# Namespace function for defining namespaces
app = angular.module 'materia', ['ngModal']
app.config ($sceDelegateProvider) ->
	$sceDelegateProvider.resourceUrlWhitelist [ STATIC_CROSSDOMAIN + "**", BASE_URL + "**" ]

window.API_LINK = '/api/json/'

window.isMobile =
	Android: -> navigator.userAgent.match(/Android/i)
	BlackBerry: -> navigator.userAgent.match(/BlackBerry/i)
	iOS: -> navigator.userAgent.match(/iPhone|iPad|iPod/i)
	Opera: -> navigator.userAgent.match(/Opera Mini/i)
	Windows: -> navigator.userAgent.match(/IEMobile/i)
	any: -> (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows())

# this code ensures that Opera runs onload/ready js events when navigating foward/back.
# http://stackoverflow.com/questions/10125701/
if history?.navigationMode?
	history.navigationMode = 'compatible'

