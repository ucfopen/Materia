<?php
return [
	'hash_file' => 'asset_hash.js.json',
	'remove_group_duplicates' => true,
	'paths' => [
		'theme'  => '/themes/default/assets/js/',
		'cdnjs' => '//cdnjs.cloudflare.com/ajax/libs/',
		'lib' => '/assets/js/lib/',
		'materia' => '//localhost:8008/assets/vendor/materia/js/',
		'static' => '//localhost:8008/assets/',
	],

	'groups' => [
		'materia'    => ['materia::materia.js'],
		'angular'    => ['cdnjs::angular.js/1.3.0/angular.min.js'],
		'ng_modal'   => ['static::vendor/ngmodal/ng-modal.min.js'],
		'jquery'     => ['cdnjs::jquery/1.8.1/jquery.min.js'],
		'author'     => ['materia::author.js'],
		'student'    => ['materia::student.js'],
		'dataTables' => ['cdnjs::datatables/1.10.7/js/jquery.dataTables.min.js'],
		'jquery_ui'  => ['cdnjs::jqueryui/1.10.4/jquery-ui.min.js'],
		'labjs'      => ['cdnjs::labjs/2.0.3/LAB.min.js'],
		'spinner'    => ['static::vendor/spinjs/spin.min.js', 'static::spin.jquery.js'],
		'fancybox'   => ['static::vendor/fancybox/jquery.fancybox.pack.js'],
		'swfobject'  => ['cdnjs::swfobject/2.2/swfobject.min.js'],

		'plupload'   => [
			'cdnjs::plupload/1.5.4/jquery.plupload.queue/jquery.plupload.queue.js',
			'cdnjs::plupload/1.5.4/plupload.js',
			'cdnjs::plupload/1.5.4/plupload.flash.js',
			'cdnjs::plupload/1.5.4/plupload.html5.js',
			'cdnjs::plupload/1.5.4/plupload.html4.js',
		],

		'jqplot'     => [
			'cdnjs::jqPlot/1.0.0/jquery.jqplot.min.js',
			'cdnjs::jqPlot/1.0.0/plugins/jqplot.barRenderer.min.js',
			'cdnjs::jqPlot/1.0.0/plugins/jqplot.canvasTextRenderer.min.js',
			'cdnjs::jqPlot/1.0.0/plugins/jqplot.canvasAxisTickRenderer.min.js',
			'cdnjs::jqPlot/1.0.0/plugins/jqplot.categoryAxisRenderer.min.js',
			'cdnjs::jqPlot/1.0.0/plugins/jqplot.cursor.min.js',
			'cdnjs::jqPlot/1.0.0/plugins/jqplot.highlighter.min.js',
		],

		'my_widgets' => [
			'cdnjs::jqueryui/1.10.4/jquery-ui.min.js',
			'static::vendor/timepicker/jquery-ui-timepicker-addon.js',
		],

		'widget_play' => ['lib::jquery-ui-1.8.21.custom.min.js'],

		'lti_picker' => ['lib::jquery-ui-1.10.3.custom.min.js'],
	],
];
