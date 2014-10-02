WidgetDetails = angular.module('widgetDetails', [])

WidgetDetails.controller 'widgetDetailsController', ($scope) ->

	$scope.widget =
		icon: "/assets/img/default/default-icon-275.png"

	SCREENSHOT_AMOUNT = 3

	init = (gateway) ->

	prepare = (callback) ->
		nameArr = window.location.pathname.replace("/widgets/", '').split("/")
		widgetID = nameArr.pop().split('-').shift()
		
		Materia.Coms.Json.send 'widgets_get', [[widgetID]], (data) ->
			populateDefaults(data[0])
			if nameArr.length > 1
				$('.widget_catalog_button').attr('href','/')
				$('.goBackText').text('Go back to the front page')

	# Populates the details page with content
	# @object The current widget.
	populateDefaults = (widget) ->
		clean_name = widget.clean_name

		$scope.widget =
			name: widget.name
			icon: Materia.Image.iconUrl(widget.dir, 394)
			subheader: widget.meta_data['subheader']
			about: widget.meta_data['about']
			demourl: document.location.pathname+'/demo'
			creatorurl: document.location.pathname+'/create'
			supported_data: widget.meta_data['supported_data']
			features: widget.meta_data['features']
		$scope.show = true

		if widget.meta_data['about'] == 'undefined'
			$scope.widget.about = 'No description available.'

		$scope.widget.screenshots = []

		for x in [1..SCREENSHOT_AMOUNT]
			$scope.widget.screenshots.push
				a: Materia.Image.screenshotUrl(widget.dir, x)
				img: Materia.Image.screenshotThumbUrl(widget.dir, x)

		$scope.showtooltip = (feature, index, type) ->
			Materia.Widget.Detail.showToolTip(index, feature, type)
		$scope.hidetooltip = ->
			Materia.Widget.Detail.hideToolTip()

		$scope.$apply()
		$('a.grouped_elements').fancybox()


	showToolTip = (pos, description, type) ->
		text = ''

		switch description
			when 'Customizable'
				text = 'As the widget creator, you supply the widget with data to make it relevant to your course.'
			when 'Scorable'
				text = 'This widget collects scores, and is well suited to gauge performance.'
			when 'Media'
				text = 'This widget uses image media as part of its supported data.'
			when 'Question/Answer'
				text = 'Users provide a typed response or associate a predefined answer wih each question.'
			when 'Multiple Choice'
				text = 'Users select a response from a collection of possible answers to questions provided by the widget.'
			when 'Mobile Friendly'
				text = 'Designed with HTML5 to work on mobile devices like the iPad and iPhone'
			else
				text = 'This feature has no additional information associated with it.'

		tt = $('<div>').addClass('tooltip').html(text)
		$('.widget_detail').append(tt)

		featureItem = $(type).eq(pos)

		left = featureItem.position().left
		height = tt.height()
		top = featureItem.position().top - height - 40

		tt.css
			'top' : top,
			'left' : left

		tt.fadeIn('fast')

	hideToolTip = ->
		tt = $('.widget_detail').find('.tooltip')
		$(tt).remove()

	Namespace('Materia.Widget').Detail =
		init        : init,
		prepare     : prepare,
		showToolTip : showToolTip,
		hideToolTip : hideToolTip

