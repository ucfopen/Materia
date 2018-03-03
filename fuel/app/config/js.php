<?php
$cdnjs = '//cdnjs.cloudflare.com/ajax/libs/';
$static = \Config::get('materia.urls.static').'js/';

return [
	// 'hash_file' => 'asset_hash.js.json',
	'remove_group_duplicates' => true,

	'groups' => [
		'materia'    => [$static.'materia.js'],
		'angular'    => [$cdnjs.'angular.js/1.3.0/angular.min.js'],
		'jquery'     => [$cdnjs.'jquery/1.8.1/jquery.min.js'],
		'admin'      => [$static.'admin.js'],
		'author'     => [$static.'author.js'],
		'student'    => [$static.'student.js'],
		'dataTables' => [$cdnjs.'datatables/1.10.7/js/jquery.dataTables.min.js'],
		'jquery_ui'  => [$cdnjs.'jqueryui/1.10.4/jquery-ui.min.js'],
		'labjs'      => [$cdnjs.'labjs/2.0.3/LAB.min.js'],
		'spinner'    => [$static.'vendor/spin.min.js', $static.'spin.jquery.js'],
		'fancybox'   => [$cdnjs.'fancybox/1.3.4/jquery.fancybox-1.3.4.pack.min.js'],
		'swfobject'  => [$cdnjs.'swfobject/2.2/swfobject.min.js'],

		'jqplot'     => [
			$cdnjs.'jqPlot/1.0.0/jquery.jqplot.min.js',
			$cdnjs.'jqPlot/1.0.0/plugins/jqplot.barRenderer.min.js',
			$cdnjs.'jqPlot/1.0.0/plugins/jqplot.canvasTextRenderer.min.js',
			$cdnjs.'jqPlot/1.0.0/plugins/jqplot.canvasAxisTickRenderer.min.js',
			$cdnjs.'jqPlot/1.0.0/plugins/jqplot.categoryAxisRenderer.min.js',
			$cdnjs.'jqPlot/1.0.0/plugins/jqplot.cursor.min.js',
			$cdnjs.'jqPlot/1.0.0/plugins/jqplot.highlighter.min.js',
		],

		'my_widgets' => [
			$cdnjs.'jqueryui/1.10.4/jquery-ui.min.js',
			$static.'vendor/timepicker/jquery-ui-timepicker-addon.js',
		],

		'widget_play' => [$static.'jquery-ui-1.8.21.custom.min.js'],

		'lti_picker' => [$static.'jquery-ui-1.10.3.custom.min.js'],
	],
];
