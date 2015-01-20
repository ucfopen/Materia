app = angular.module 'materia'
app.controller 'currentUserCtrl', ($scope, $sce, userServ, $http, $rootScope) ->

	$scope.currentUser = userServ.getCurrentUser()

	# Beard mode
	window.BEARDS = ['dusty_full', 'black_chops', 'grey_gandalf', 'red_soul']

	addBeardMode = ->
		link = document.createElement "link"
		link.id = "beard_css"
		link.rel = "stylesheet"
		link.href = "/themes/default/assets/css/beard_mode.css"
		document.head.appendChild link

	removeBeardMode = ->
		link = document.getElementById "beard_css"
		link.parentElement.removeChild link

	if $scope.currentUser.beardMode
		addBeardMode()

	konami = ''

	window.addEventListener "keydown", (e) ->
		switch e.which or e.keyCode
			when 38
				konami += 'up'
			when 40
				konami += 'down'
			when 37
				konami += 'left'
			when 39
				konami += 'right'
			when 66
				konami += 'b'
			when 65
				konami += 'a'
			else
				konami = ''

		if konami == 'upupdowndownleftrightleftrightba'
			$scope.currentUser.beardMode = !$scope.currentUser.beardMode
			if $scope.currentUser.beardMode
				addBeardMode()
			else
				removeBeardMode()

			$http.post '/api/user/settings', $scope.currentUser

			konami = ''

