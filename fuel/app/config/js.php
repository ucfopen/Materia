<?php
return [
	'remove_group_duplicates' => true,

	'paths' => [
		'theme'  => '/themes/default/assets/js/',
		'cdnjs' =>
			'https://cdnjs.cloudflare.com/ajax/libs/',
		'lib' => '/assets/js/lib/',
	],

	'groups' => [
		'style_guide' => [
			'http://yandex.st/highlightjs/8.0/highlight.min.js',
			'theme::style-guide.js'
		],
		'modernizr' => [
			'cdnjs::modernizr/2.6.2/modernizr.min.js',
		],
		'jquery' => [
			'cdnjs::jquery/1.8.1/jquery.min.js',
		],
		'angular' => [
			'cdnjs::angular.js/1.2.20/angular.min.js',
		],
		'underscore' => [
			'cdnjs::underscore.js/1.5.2/underscore-min.js',
		],
		'labjs' => [
			'cdnjs::labjs/2.0.3/LAB.min.js',
		],
		'swfobject' => [
			'cdnjs::swfobject/2.2/swfobject.js',
		],
		'dataTables' => [
			'cdnjs::datatables/1.10.0/jquery.dataTables.min.js',
		],
		'datejs' => [
			'cdnjs::datejs/1.0/date.min.js',
		],
		'fancybox' => [
			'lib/jquery.fancybox-1.3.4.pack.js',
		],
		'core' => [
			'cdnjs::angular.js/1.3.0/angular.min.js',
			'cdnjs::jquery/1.8.1/jquery.min.js',
			'cdnjs::swfobject/2.2/swfobject.min.js',
			'theme::main.js',
			'theme::materia.js',
			'theme::controllers.js',
		],
		'help' => [
			'theme::materia.flashcheck.js',
			'theme::materia.page.help.js',
		],
		'notifications' => [
			'theme::materia.notification.js',
		],
		'homepage' => [
			'cdnjs::jqueryui/1.10.4/jquery-ui.min.js',
		],
		'media_catalog' => [
			'theme::materia.page.media-import.js',
			'theme::materia.coms.json.js',
			'lib::jquery.plupload.queue.js',
			'lib::plupload.js',
			'lib::plupload.flash.js',
			'lib::plupload.html5.js',
			'lib::plupload.html4.js',
		],
		'question_catalog' => [
			'theme::materia.questionimporter.js',
			'theme::materia.coms.json.js',
		],
		'scores' => [
			'lib::jquery.jqplot.min.js',
			'lib::jqplot_plugins/jqplot.barRenderer.min.js',
			'lib::jqplot_plugins/jqplot.canvasTextRenderer.min.js',
			'lib::jqplot_plugins/jqplot.canvasAxisTickRenderer.min.js',
			'lib::jqplot_plugins/jqplot.categoryAxisRenderer.min.js',
			'lib::jqplot_plugins/jqplot.cursor.min.js',
			'lib::jqplot_plugins/jqplot.highlighter.min.js',
			'cdnjs::labjs/2.0.3/LAB.min.js',
		],
		'embed_scores' => [
			'theme::materia.coms.json.js',
			'theme::materia.scores.js',
			'theme::materia.scores.scoregraphics.js',
		],
		'login' => [
			'lib::jquery.infieldlabel.js',
			'theme::materia.set.availability.js',
			'theme::materia.set.datetime.js',
			'theme::materia.page.login.js'
		],
		'settings' => [
			'lib::spin.js',
			'lib::spin.jquery.js',
		],
		'profile' => [
			'theme::materia.profile.activity.load.js',
			'theme::materia.page.profile.js',
			'theme::materia.coms.json.js',
			'theme::materia.set.datetime.js',
		],
		'widget_catalog' => [
			'lib::spin.js',
			'lib::spin.jquery.js',
			'lib::sorted.js',
		],
		'widget_detail' => [
			'lib::jquery.fancybox-1.3.4.pack.js',
		],
		'widget_editor' => [
			'theme::materia.set.throbber.js',
			'lib::jqmodal.js',
			'lib::tablock.js',
			'lib::jquery-ui-1.8.21.custom.min.js',
			'lib::spin.js',
			'lib::spin.jquery.js',
			'theme::materia.coms.json.js',
			'theme::materia.creator.js',
		],
		'my_widgets' => [
			'theme::materia.set.datetime.js',
			'theme::materia.validate.textfield.js',
			'theme::materia.permissions.user.js',
			'theme::materia.permissions.widget.js',
			'theme::materia.page.notification.js',
			'theme::materia.image.js',
			'theme::materia.textfilter.js',
			'lib::jqmodal.js',
			'lib::tablock.js',
			'theme::materia.set.throbber.js',
			'lib::spin.js',
			'lib::spin.jquery.js',
			'theme::materia.coms.json.js',
			'cdnjs::jqueryui/1.10.4/jquery-ui.min.js',
			'lib::jquery-ui-timepicker-addon.js',
			'theme::materia.user.js',
			'theme::materia.widget.js',
			'theme::materia.widgetinstance.js',
			'theme::materia.mywidgets.availability.js',
			'theme::materia.mywidgets.selectedwidget.js',
			'theme::materia.mywidgets.sidebar.js',
			'theme::materia.mywidgets.statistics.js',
			'theme::materia.mywidgets.tasks.js',
			'theme::materia.mywidgets.csv.js',
			'theme::materia.set.availability.js',
			'theme::materia.page.my-widgets.js',
			'lib::jquery.jqplot.min.js',
			'lib::jqplot_plugins/jqplot.barRenderer.min.js',
			'lib::jqplot_plugins/jqplot.canvasTextRenderer.min.js',
			'lib::jqplot_plugins/jqplot.canvasAxisTickRenderer.min.js',
			'lib::jqplot_plugins/jqplot.categoryAxisRenderer.min.js',
			'lib::jqplot_plugins/jqplot.cursor.min.js',
			'lib::jqplot_plugins/jqplot.highlighter.min.js',
			'lib::md5.js'
		],
		'widget_play' => [
			'lib::jqmodal.js',
			'lib::tablock.js',
			'lib::jquery-ui-1.8.21.custom.min.js',
			'theme::materia.coms.json.js',
			'theme::materia.player.js'
		],
		'lti_picker' => [
				'lib::spin.js',
				'lib::spin.jquery.js',
				'lib::jquery-ui-1.10.3.custom.min.js',
		],
	],
];
