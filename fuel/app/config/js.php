<?php
$cdnjs = '//cdnjs.cloudflare.com/ajax/libs/';
$static = \Config::get('materia.urls.static').'js/';

return [
	// 'hash_file' => 'asset_hash.js.json',
	'remove_group_duplicates' => true,

	'groups' => [
		'materia'    => [$static.'materia.js'],
		'angular'    => [$cdnjs.'angular.js/1.6.9/angular.min.js'],
		'jquery'     => [$cdnjs.'jquery/3.3.1/jquery.min.js'],
		'admin'      => [$static.'admin.js'],
		'author'     => [$static.'author.js'],
		'student'    => [$static.'student.js'],
		'dataTables' => [$static.'vendor/datatables/jquery.dataTables.min.js'],
		'jquery_ui'  => [$cdnjs.'jqueryui/1.10.4/jquery-ui.min.js'],
		'labjs'      => [$static.'vendor/labjs/LAB.min.js'],
		'spinner'    => [$static.'vendor/spin.min.js', $static.'spin.jquery.js'],
		'fancybox'   => [$static.'vendor/fancybox/jquery.fancybox.min.js'],
		'swfobject'  => [$static.'vendor/swfobject/swfobject.js'],

		'jqplot'     => [
			$cdnjs.'jqPlot/1.0.9/jquery.jqplot.min.js',
			$cdnjs.'jqPlot/1.0.9/plugins/jqplot.barRenderer.min.js',
			$cdnjs.'jqPlot/1.0.9/plugins/jqplot.canvasTextRenderer.min.js',
			$cdnjs.'jqPlot/1.0.9/plugins/jqplot.canvasAxisTickRenderer.min.js',
			$cdnjs.'jqPlot/1.0.9/plugins/jqplot.categoryAxisRenderer.min.js',
			$cdnjs.'jqPlot/1.0.9/plugins/jqplot.cursor.min.js',
			$cdnjs.'jqPlot/1.0.9/plugins/jqplot.highlighter.min.js',
		],

		'my_widgets' => [
			$cdnjs.'jqueryui/1.10.4/jquery-ui.min.js',
			$static.'vendor/timepicker/jquery-ui-timepicker-addon.js',
		]
	],
];
