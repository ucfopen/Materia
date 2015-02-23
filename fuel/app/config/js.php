<?php
return [
	'remove_group_duplicates' => true,

	'paths' => [
		'theme'  => '/themes/default/assets/js/',
		'cdnjs' => '//cdnjs.cloudflare.com/ajax/libs/',
		'lib' => '/assets/js/lib/',
	],

	'groups' => [
		'materia'    => ['theme::materia.min.js'],
		'angular'    => ['cdnjs::angular.js/1.3.0/angular.min.js'],
		'ng_modal'   => ['lib::bower/ngModal/dist/ng-modal.min.js'],
		'jquery'     => ['cdnjs::jquery/1.8.1/jquery.min.js'],
		'author'     => ['theme::author.min.js'],
		'student'    => ['theme::student.min.js'],
		'dataTables' => ['cdnjs::datatables/1.10.0/jquery.dataTables.min.js'],
		'jquery_ui'  => ['cdnjs::jqueryui/1.10.4/jquery-ui.min.js'],
		'labjs'      => ['cdnjs::labjs/2.0.3/LAB.min.js'],
		'spinner'    => ['lib::spin.js', 'lib::spin.jquery.js'],
		'sorted'     => ['lib::sorted.js'],
		'fancybox'   => ['lib::jquery.fancybox-1.3.4.pack.js'],
		'swfobject'  => ['cdnjs::swfobject/2.2/swfobject.min.js'],
		'tablock'    => ['lib::tablock.js'],

		'plupload'   => [
			'lib::jquery.plupload.queue.js',
			'lib::plupload.js',
			'lib::plupload.flash.js',
			'lib::plupload.html5.js',
			'lib::plupload.html4.js'
		],

		'jqplot'     => [
			'lib::jquery.jqplot.min.js',
			'lib::jqplot_plugins/jqplot.barRenderer.min.js',
			'lib::jqplot_plugins/jqplot.canvasTextRenderer.min.js',
			'lib::jqplot_plugins/jqplot.canvasAxisTickRenderer.min.js',
			'lib::jqplot_plugins/jqplot.categoryAxisRenderer.min.js',
			'lib::jqplot_plugins/jqplot.cursor.min.js',
			'lib::jqplot_plugins/jqplot.highlighter.min.js',
		],

		'my_widgets' => [
			'cdnjs::jqueryui/1.10.4/jquery-ui.min.js',
			'lib::jquery-ui-timepicker-addon.js',
			'lib::md5.js',
		],

		'widget_play' => ['lib::jquery-ui-1.8.21.custom.min.js'],

		'lti_picker' => ['lib::jquery-ui-1.10.3.custom.min.js'],
	],
];
