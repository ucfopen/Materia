$(document).ready ->
	# ===================== INIT ==================================

	Materia.Set.Throbber.startSpin('.courses')

	SEARCH_DELAY_MS = 200
	searchDelayTimeoutId = 0

	Materia.MyWidgets.SelectedWidget.init()
	Materia.MyWidgets.Availability.init()
	Materia.MyWidgets.Tasks.init()
	Materia.MyWidgets.Csv.init()

	$('.delete_dialogue .cancel_button').click (e) ->
		e.preventDefault()
		$('.delete').click()

	$('.delete_dialogue .delete_button').click (e) ->
		e.preventDefault()
		inst_id = $('.gameSelected').attr('id').split('_')[1]

		Materia.MyWidgets.Tasks.deleteWidget(inst_id)
		$('#delete_widget_link').click()

	# ================= SIDEBAR SETUP =======================================
	Materia.TextFilter.setupInput $('.search .textbox'),
		Materia.MyWidgets.Sidebar.search, SEARCH_DELAY_MS

	$('#page').hide()
	$(".widget_list h2").click ->
		Materia.MyWidgets.Sidebar.hideAndShowSidebar(this)
		false

	# =================== SCORE GRAPH AREA SETUP ==================================
	Materia.TextFilter.setupInput $('.score-search').children(':first-child'),
		Materia.MyWidgets.Statistics.searchScores, SEARCH_DELAY_MS

	# Switches between the graph and table, depending on which choice is clicked
	$(document).on 'click', '.choices li a', (event) ->
		event.preventDefault()

		type = $(this).attr('class')
		if  !$(this).parent().hasClass('scoreTypeSelected')
			semester = $(this).parents('.scoreWrapper').attr('data-semester')
			Materia.MyWidgets.SelectedWidget.setScoreView(semester, type)
		false

	$(".type li a").click (event) ->
		event.preventDefault()

		type = $(this).attr("id")
		if not $(this).hasClass('graphSelected')
			$('.type li a.graphSelected').removeClass('graphSelected')
			$(this).addClass('graphSelected')
			Materia.MyWidgets.Statistics.createGraph(type)
		false

	# ================= WATCH FOR URL CHANGES =======================
	$(window).bind 'hashchange', Materia.MyWidgets.Sidebar.getWidgetByURL

