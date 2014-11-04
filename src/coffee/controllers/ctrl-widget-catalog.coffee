Namespace('Materia.Widget').Catalog = null

app.controller 'widgetCtrl', ['$scope', ($scope) ->
	$scope.widgets = []
	$scope.infoCard = []
	$scope.card = 0
	_callback = null

	#Executes the API function and then calls the replace default content
	prepare = (callback) ->
		_callback = callback
		Materia.Coms.Json.send 'widgets_get', null, (data) ->
			Materia.Set.Throbber.startSpin('.page')

			$scope.widgets = data
			for widget, i in $scope.widgets
				widget.icon = Materia.Image.iconUrl(widget.dir, 92)

			Materia.Set.Throbber.stopSpin('.page')

			if _callback? then _callback()
			$scope.$apply()

	$scope.showInfoCard = (id) ->
		if $scope.card != 0
			$scope.hideInfoCard()

		$scope.infoCard[id] = true
		$scope.card = id

	$scope.hideInfoCard = ->
		if $scope.card != 0
			$scope.infoCard[$scope.card] = false
			$scope.card = 0

	Namespace('Materia.Widget').Catalog =
		prepare : prepare
]

