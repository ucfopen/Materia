# Handles all of the calls for the sidebar
MyWidgets = angular.module 'MyWidgets'

MyWidgets.controller 'SidebarController', ($scope, widgetSrv, selectedWidgetSrv) ->
	firstRun = true

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
		if firstRun and window.location.hash
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
			firstRun = false

	# Populate the widget list
	# This was originally part of prepare(), but is prepare really necessary now?
	deferredWidgets = widgetSrv.getWidgets()
	deferredWidgets.then updateWidgets

	$scope.setSelected = (id) ->
		widgetSrv.getWidget id, (inst) ->
			selectedWidgetSrv.set inst

	showWidgetCatNumbers = ->
		$('.widget_list').each (i) ->
			#applicable as long as each widget list is preceded by the category tag
			$(this).prev().addClass 'widget_list_category'

	$scope.search = (searchString) ->
		$scope.query = searchString

		widgets = widgetSrv.getWidgets()
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
				hits.push widget
			else
				misses.push widget

MyWidgets.filter 'highlight', ($sce) ->
	return (text, search) ->
		if search
			searchTerms = search.searchCache.split(" ")
			for search in searchTerms
				text = text.replace(new RegExp('(' + search + ')', 'gi'), (a, b, c, d) ->
					t = d.substr(c).split("<")
					if t[0].indexOf(">") != -1
						return a
					return '<span class="highlighted">' + a + '</span>'
				)
		return $sce.trustAsHtml(text)

