// utilities ported from angular that need to be commonly referenced in any page

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