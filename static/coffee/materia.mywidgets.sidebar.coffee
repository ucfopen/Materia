# Handles all of the calls for the sidebar
Namespace('Materia.MyWidgets').Sidebar = do ->

	# ============ GET WIDGETS FROM SERVER =========================
	prepare = ->
		Materia.Widget.getWidgets (widgets) ->
			buildDefaultList widgets

			# if there's a hash, select it
			if window.location.hash
				found = false
				selID = window.location.hash.substr(1)

				for widget in widgets
					if widget.id == selID
						found = true
						break
				if found
					Materia.MyWidgets.SelectedWidget.setSelected selID
				else
					Materia.MyWidgets.SelectedWidget.noAccess()

	# Builds the sidebar with all of the widgets that come back from the api.
	# @var array A list of widget objects
	buildDefaultList = (widgets) ->
		bearded = BEARD_MODE? && BEARD_MODE == true
		$("div[data-template=widget-list] .icon").addClass 'bearded' if bearded

		len = widgets.length
		rightSide = $('section.directions')

		if len == 0
			Materia.MyWidgets.SelectedWidget.noWidgets()
		else
			rightSide.addClass 'unchosen'
			Materia.Widget.sortWidgets()

			#@TODO: This probably shouldn't happen until we're sure the widget list is filled.
			$('.courses').on 'click', '.widget', (event) ->
				event.preventDefault()
				Materia.MyWidgets.SelectedWidget.setSelected $(this).attr('id').split('_')[1]
				return false

			$('.my_widgets aside .courses .course_list').css overflow:'visible' if bearded

		Materia.Set.Throbber.stopSpin '.courses'

	showWidgetCatNumbers = ->
		$('.widget_list').each (i) ->
			#applicable as long as each widget list is preceded by the category tag
			$(this).prev().addClass 'widget_list_category'

	search = (searchString) ->
		Materia.Widget.getWidgets (widgets) ->
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
			Materia.MyWidgets.SelectedWidget.noAccess()

		false

	prepare              : prepare
	showWidgetCatNumbers : showWidgetCatNumbers
	search               : search
	getWidgetByURL       : getWidgetByURL