const app = angular.module('materia', [])
app.config(($sceDelegateProvider) =>
	$sceDelegateProvider.resourceUrlWhitelist(['self', STATIC_CROSSDOMAIN + '**', BASE_URL + '**'])
)

window.API_LINK = '/api/json/'

window.isMobile = {
	Android() {
		return navigator.userAgent.match(/Android/i)
	},
	BlackBerry() {
		return navigator.userAgent.match(/BlackBerry/i)
	},
	iOS() {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i)
	},
	Opera() {
		return navigator.userAgent.match(/Opera Mini/i)
	},
	Windows() {
		return navigator.userAgent.match(/IEMobile/i)
	},
	any() {
		return (
			isMobile.Android() ||
			isMobile.BlackBerry() ||
			isMobile.iOS() ||
			isMobile.Opera() ||
			isMobile.Windows()
		)
	},
}

// this code ensures that Opera runs onload/ready js events when navigating foward/back.
// http://stackoverflow.com/questions/10125701/
if (history && history.navigationMode) {
	history.navigationMode = 'compatible'
}
