const app = angular.module('materia')
app.controller('HomePageSpotlightCtrl', function () {
	// find all the spotlights, assign them an id, and make a radio button for them
	Materia.Store.SlideShow.formatCycler(Array.from(document.querySelectorAll('.store_main')))
})
