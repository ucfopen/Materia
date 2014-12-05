# Handles all of the calls for the sidebar
MyWidgets = angular.module 'MyWidgets'

MyWidgets.controller 'SidebarController', ($scope, widgetSrv, selectedWidgetSrv) ->
	$scope.selectedWidget = null

	$scope.$on 'selectedWidget.update', (evt) ->
		$scope.selectedWidget = selectedWidgetSrv.get()

	$scope.$on 'widgetList.update', (evt) ->
		updateWidgets widgetSrv.getWidgets()

	$scope.widgets = []

	updateWidgets = (data) ->
		Materia.Set.Throbber.stopSpin '.courses'

		if !data
			selectedWidgetSrv.setNoWidgets true
			$scope.widgets = []
			$scope.$apply()
		else if data.then?
			data.then updateWidgets
		else
			angular.forEach data, (widget, key) ->
				widget.icon = Materia.Image.iconUrl(widget.widget.dir, 60)

			$scope.$apply ->
				$scope.widgets = data

	# Populate the widget list
	# This was originally part of prepare(), but is prepare really necessary now?
	deferredWidgets = widgetSrv.getWidgets()
	deferredWidgets.then updateWidgets

	if window.location.hash
		found = false
		selID = window.location.hash.substr(1)

		for widget in $scope.widgets
			if widget.id == selID
				found = true
				break

		if found
			$scope.setSelected(selID)
		else
			#TODO: Update
			Materia.MyWidgets.SelectedWidget.noAccess()

	$scope.setSelected = (id) ->
		widgetSrv.getWidget id, (inst) ->
			selectedWidgetSrv.set inst

	showWidgetCatNumbers = ->
		$('.widget_list').each (i) ->
			#applicable as long as each widget list is preceded by the category tag
			$(this).prev().addClass 'widget_list_category'

	search = (searchString) ->
		widgetSrv.getWidgets (widgets) ->
			searchString = $.trim searchString.toLowerCase().replace(/,/g, ' ')
			hits = []
			misses = []
			terms = searchString.split ' '
			len = widgets.length
			len2 = terms.length
			for widget in widgets
				match = false
				for term in terms
					if widget.searchCache.indexOf(term) > -1
						match = true
					else
						match = false
						break
				if match
					hits.push widget.element
				else
					misses.push widget.element

			$hits = $(hits)
			Materia.TextFilter.renderSearch $hits, $(misses), 'slide'

			Materia.TextFilter.clearHighlights $('.widget')
			$hits.each ->
				Materia.TextFilter.highlight searchString, $(this)
			Materia.TextFilter.zebraStripe()

	getWidgetByURL = ->
		newHash = window.location.hash
		widgetID = newHash.substr(1)

		return false if !newHash

		tar = $('#widget_'+widgetID)
		if tar.length > 0
			tar.trigger 'click'
		else
			#TODO: Update
			Materia.MyWidgets.SelectedWidget.noAccess()

		false

	Namespace('Materia.MyWidgets').Sidebar =
		showWidgetCatNumbers : showWidgetCatNumbers,
		search               : search,
		getWidgetByURL       : getWidgetByURL
