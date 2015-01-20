app = angular.module 'materia'
app.controller 'currentUserCtrl', ($scope, $sce, userServ, $http) ->

	$scope.currentUser = userServ.getCurrentUser()
	$scope.hasNoWidgets = false

	$scope.$on 'selectedWidget.hasNoWidgets', (evt) ->
		$scope.hasNoWidgets = true
		$scope.$apply()


	# Beard mode
	window.BEARDS = ['dusty_full', 'black_chops', 'grey_gandalf', 'red_soul']

	addBeardMode = ->
		$('link:last').after('<link rel="stylesheet" href="/themes/default/assets/css/beard_mode.css" type="text/css" data-src="page" />')

	if window.BEARD_MODE
		addBeardMode()

	$(document).ready ->
		konami = ''

		$(document).keydown (e) ->
			switch e.which
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

				$icon = $('.icon')
				meta = {}
				if($icon.hasClass('bearded'))
					window.BEARD_MODE = false

					$('link[href="/themes/default/assets/css/beard_mode.css"]').remove()

					$('.icon').removeClass('bearded')
					$('.icon_container').removeClass('big_bearded')

					$('.widget .icon').each (index) ->
						for j in [0...BEARDS.length]
							if $(this).hasClass('small_'+BEARDS[j])
								$(this).removeClass('small_'+BEARDS[j])

							if $('.icon_container').hasClass('med_'+BEARDS[j])
								$('.icon_container').removeClass('med_'+BEARDS[j])
				else
					window.BEARD_MODE = true
					addBeardMode()

					# my widgets
					$('.widget .icon').addClass('bearded')
					$('.icon_container').addClass('big_bearded')
					$('.widget .icon').each (index) ->
						rand = Math.floor((Math.random()*BEARDS.length)+1) - 1

						$(this).addClass('small_'+BEARDS[rand])

						if ($(this).parent().hasClass('gameSelected'))
							$('.icon_container').addClass('med_'+BEARDS[rand])
				konami = ''

				$scope.currentUser.beardMode = window.BEARD_MODE

				$http.post('/api/user/settings', $scope.currentUser)

