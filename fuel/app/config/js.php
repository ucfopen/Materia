<?php
return [
	'remove_group_duplicates' => true,

	'paths' => [
		'theme'  => '/themes/default/assets/js/',
		'cdnjs' => '//cdnjs.cloudflare.com/ajax/libs/',
		'lib' => '/assets/js/lib/',
	],

	'groups' => [
		'core' => [
			'cdnjs::angular.js/1.3.0/angular.min.js',
			'cdnjs::jquery/1.8.1/jquery.min.js',
			'lib::bower/ngModal/dist/ng-modal.min.js',
			'theme::materia.js',
		],
		'author' => [
			'theme::author.js',
		],
		'student' => [
			'theme::student.js',
		],
		'dataTables' => [
			'cdnjs::datatables/1.10.0/jquery.dataTables.min.js',
		],
		'homepage' => [
			'cdnjs::jqueryui/1.10.4/jquery-ui.min.js',
		],
		'media_catalog' => [
			'lib::jquery.plupload.queue.js',
			'lib::plupload.js',
			'lib::plupload.flash.js',
			'lib::plupload.html5.js',
			'lib::plupload.html4.js',
		],
		'scores' => [
			'cdnjs::labjs/2.0.3/LAB.min.js',
		],
		'settings' => [
			'lib::spin.js',
			'lib::spin.jquery.js',
		],
		'widget_catalog' => [
			'lib::spin.js',
			'lib::spin.jquery.js',
			'lib::sorted.js',
		],
		'widget_detail' => [
			'lib::jquery.fancybox-1.3.4.pack.js',
		],
		'my_widgets' => [
			'lib::jqmodal.js',
			'lib::tablock.js',
			'lib::spin.js',
			'lib::spin.jquery.js',
			'cdnjs::jqueryui/1.10.4/jquery-ui.min.js',
			'lib::jquery-ui-timepicker-addon.js',
			'lib::jquery.jqplot.min.js',
			'lib::jqplot_plugins/jqplot.barRenderer.min.js',
			'lib::jqplot_plugins/jqplot.canvasTextRenderer.min.js',
			'lib::jqplot_plugins/jqplot.canvasAxisTickRenderer.min.js',
			'lib::jqplot_plugins/jqplot.categoryAxisRenderer.min.js',
			'lib::jqplot_plugins/jqplot.cursor.min.js',
			'lib::jqplot_plugins/jqplot.highlighter.min.js',
			'lib::md5.js',
		],
		'widget_play' => [
			'cdnjs::swfobject/2.2/swfobject.min.js',
			'lib::jqmodal.js',
			'lib::tablock.js',
			'lib::jquery-ui-1.8.21.custom.min.js',
		],
		'lti_picker' => [
			'lib::spin.js',
			'lib::spin.jquery.js',
			'lib::jquery-ui-1.10.3.custom.min.js',
		],
	],
];
