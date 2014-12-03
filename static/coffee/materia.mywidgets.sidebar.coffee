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
		console.log data
		if !data then selectedWidgetSrv.setNoWidgets true
		else
			angular.forEach data, (widget, key) ->
				widget.icon = Materia.Image.iconUrl(widget.widget.dir, 60)

			$scope.$apply ->
				$scope.widgets = data

			# TODO clean up
			Materia.Set.Throbber.stopSpin '.courses'

	# Populate the widget list
	# This was originally part of prepare(), but is prepare really necessary now?
	deferredWidgets = widgetSrv.getWidgets()
	deferredWidgets.then updateWidgets


	# TODO check for Beard Mode & apply styles

	# ============ GET WIDGETS FROM SERVER =========================
	prepare = ->

		# TODO: Throbber functionality needs to be taken care of
		# Materia.Set.Throbber.startSpin '.page'
		# buildDefaultList()

		# if there's a hash, select it
		# TODO clean this ish up
		# TODO: determine if this whole function is necessary or if it should just be dumped in controller
		if window.location.hash
			found = false
			selID = window.location.hash.substr(1)

			for widget in $scope.widgets
				if widget.id == selID
					found = true
					break

			if found then $scope.setSelected(selID)

			else
				#TODO: Update
				Materia.MyWidgets.SelectedWidget.noAccess()

	$scope.setSelected = (id) ->
		widgetSrv.getWidget id, (inst) ->
			selectedWidgetSrv.set inst

	# Builds the sidebar with all of the widgets that come back from the api.
	# @var array A list of widget objects
	buildDefaultList = ->
		bearded = BEARD_MODE? && BEARD_MODE == true
		$("div[data-template=widget-list] .icon").addClass 'bearded' if bearded

		len = $scope.widgets.length
		rightSide = $('section.directions')

		if len == 0
			# TODO: Update
			Materia.MyWidgets.SelectedWidget.noWidgets()
		else
			rightSide.addClass 'unchosen'
			return false

			$('.my_widgets aside .courses .course_list').css overflow:'visible' if bearded

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
		prepare              : prepare,
		showWidgetCatNumbers : showWidgetCatNumbers,
		search               : search,
		getWidgetByURL       : getWidgetByURL
