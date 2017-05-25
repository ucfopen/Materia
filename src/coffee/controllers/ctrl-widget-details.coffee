app = angular.module 'materia'
app.controller 'widgetDetailsController', ($scope, widgetSrv) ->

	$scope.widget =
		icon: "/themes/default/assets/img/default/default-icon-275.png"
	$scope.goback =
		text: "Go back to the widget catalog"
		url: "/widgets"

	tooltipDescriptions =
		'Customizable': 'As the widget creator, you supply the widget with data to make it relevant to your course.'
		'Scorable': 'This widget collects scores, and is well suited to gauge performance.'
		'Media': 'This widget uses image media as part of its supported data.'
		'Question/Answer': 'Users provide a typed response or associate a predefined answer wih each question.'
		'Multiple Choice': 'Users select a response from a collection of possible answers to questions provided by the widget.'
		'Mobile Friendly': 'Designed with HTML5 to work on mobile devices like the iPad and iPhone'
		'Fullscreen': 'This widget may be allowed to temporarily take up your entire screen.'

	SCREENSHOT_AMOUNT = 3

	nameArr = window.location.pathname.replace("/widgets/", '').split("/")
	widgetID = nameArr.pop().split('-').shift()

	widgetSrv.getWidgetInfo widgetID, (data) ->
		populateDefaults(data[0])
		if nameArr.length > 1
			$scope.goback =
				url: "/"
				text: "Go back to the front page"

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
			supported_data: widget.meta_data['supported_data'].map tooltipObject
			features: widget.meta_data['features'].map tooltipObject

		$scope.show = true

		if widget.meta_data['about'] == 'undefined'
			$scope.widget.about = 'No description available.'

		$scope.widget.screenshots = []

		for x in [1..SCREENSHOT_AMOUNT]
			$scope.widget.screenshots.push
				a: Materia.Image.screenshotUrl(widget.dir, x)
				img: Materia.Image.screenshotThumbUrl(widget.dir, x)

		$scope.$apply()

	tooltipObject = (txt) ->
		text: txt
		show: false
		description: tooltipDescriptions[txt] or 'This feature has no additional information associated with it.'

