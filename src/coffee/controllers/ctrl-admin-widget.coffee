app = angular.module 'materia'
app.controller 'adminWidgetController', ($scope, adminSrv) ->

	$scope.selectedFileName = 'No File Selected'
	$scope.widgets = []

	$scope.save = (widget) ->
		update =
			id: widget.id
			clean_name: widget.clean_name
			in_catalog: widget.in_catalog
			is_editable: widget.is_editable
			is_scorable: widget.is_scorable
			is_playable: widget.is_playable
			about: widget.meta_data.about
			excerpt: widget.meta_data.excerpt
			demo: widget.meta_data.demo
		adminSrv.saveWidget update, (response) ->
			widget.error_message = []
			for prop, stat of response
				widget.error_message.push stat unless stat == true
			delete widget.error_message if widget.error_message.len is 0
			$scope.$apply()

	displayWidgets = ->
		adminSrv.getWidgets (widgets) ->
			for widget, i in widgets
				widget.icon = Materia.Image.iconUrl widget.dir, 60

			$scope.widgets = widgets
			$scope.$apply()

	# since the file input is hidden, watch events on it so we can put selected filenames elsewhere
	document.getElementById('widget_uploader').addEventListener 'change', (e) ->
		$scope.selectedFileName = 'No File Selected'
		if this.files?.length > 0
			$scope.selectedFileName = this.files[0].name
		$scope.$apply()

	displayWidgets()