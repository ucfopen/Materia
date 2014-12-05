$(document).ready ->
	# ===================== INIT ==================================

	Materia.Set.Throbber.startSpin('.courses')

	SEARCH_DELAY_MS = 200
	searchDelayTimeoutId = 0

	Materia.MyWidgets.SelectedWidget.init()
	Materia.MyWidgets.Sidebar.prepare()
	Materia.MyWidgets.Availability.init()
	Materia.MyWidgets.Tasks.init()
	Materia.MyWidgets.Csv.init()

	# ================== SHARE DIALOG SETUP =========================
	$('#share_widget_link').jqmodal
		modal            : true,
		backgroundStyle  : 'light',
		className        : 'share',
		html             : $('#t-share-popup').html(),
		closingSelectors : ['.cancel_button']
	, ->
		lastSearch = ""
		currSearch = ""
		$input = $('#popup .user_add')
		addPos = $input.offset()

		$('#popup #adding .search_list').offset
			left: addPos.left
			top: addPos.top+$input.height()

		$('#popup #adding #roleExpiration').datepicker
			minDate: new Date()

		$('#popup .toggle_transfer').hide()

		 # hiding it here because it has to exist to find the add field's position
		$('#popup #adding').hide()

		Materia.Permissions.Widget.buildPermsList()
		Materia.Permissions.User.repositionSearchWindow()

		$('#popup #access .add').click ->
			$('#popup #access').hide()
			$('#popup #adding').show()
			$input.focus()

		$('#popup #adding .cancel_button').click (e) ->
			e.preventDefault()
			$('#popup #access').show()
			$('#popup #adding').hide()
			$input.html('')
			$('.share_user_to_add').remove()

		$('#popup #adding').click ->
			$('#popup #adding .search_list').empty().hide()

		$('#popup #adding #input_holder').click ->
			$('#popup #adding #input_area').focus()

		$input
			.keyup (e) ->
				# don't react to arrow keys or enter key
				if (e.which >= 37 and e.which <= 40) or e.which == 13
					return

				# esc
				if e.which == 27 or $input.val() == ''
					$input.val('')
					closeSearch()

				if $input.val() != lastSearch
					clearTimeout(searchDelayTimeoutId)
					searchDelayTimeoutId = setTimeout ->
						Materia.Permissions.User.search($input.val())
					, SEARCH_DELAY_MS

				lastSearch = $input.val()
			.keydown (e) ->
				if e.which == 9
					if not $(".search_list").is(":hidden") and $(".search_list .no_match_message").length is 0
						$("#popup").tablock("release")
						$(".list_tab_lock").tablock()
						$(".list_tab_lock").on "keyup.escape_check", (ev) ->
							if ev.which == 27
								closeSearch()
								$(".list_tab_lock").tablock("release")
								$(".list_tab_lock").off("keyup.escape_check")
								$input.focus()
								$("#popup").tablock()
						$(".search_list").on "keypress", ".search_match", (ev) ->
							if ev.which == 13
								$(this).trigger("click")
								$(".list_tab_lock").tablock("release")
								$(".list_tab_lock").off("keyup.escape_check")
								$("#popup").tablock()
					else
						closeSearch()
						return

				# don't react to arrow keys or enter key
				if (e.which >= 37 and e.which <= 40) or e.which == 13 or (e.which == 8 and $input.val() is '')
					return

				$('#popup .search_list').slideDown(100)

				Materia.Permissions.User.repositionSearchWindow()

		$('.save_button').on 'click', (e) ->
			e.preventDefault()

			Materia.Permissions.Widget.saveAndClose()

			$('#popup #adding .cancel_button').click()

		closeSearch = ->
			$('#popup .search_list').empty().slideUp(50)
			lastSearch = ''

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
	# $(document).on 'click', '.choices li a', (event) ->
	# 	event.preventDefault()

	# 	type = $(this).attr('class')
	# 	if  !$(this).parent().hasClass('scoreTypeSelected')
	# 		semester = $(this).parents('.scoreWrapper').attr('data-semester')
	# 		Materia.MyWidgets.SelectedWidget.setScoreView(semester, type)
	# 	false

	# $(".type li a").click (event) ->
	# 	event.preventDefault()

	# 	type = $(this).attr("id")
	# 	if not $(this).hasClass('graphSelected')
	# 		$('.type li a.graphSelected').removeClass('graphSelected')
	# 		$(this).addClass('graphSelected')
	# 		Materia.MyWidgets.Statistics.createGraph(type)
	# 	false

	# ================= WATCH FOR URL CHANGES =======================
	$(window).bind 'hashchange', Materia.MyWidgets.Sidebar.getWidgetByURL

