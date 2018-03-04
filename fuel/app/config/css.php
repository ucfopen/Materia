<?php
$cdnjs = '//cdnjs.cloudflare.com/ajax/libs/';
$static = \Config::get('materia.urls.static');
$static_css = $static.'css/';
$g_fonts = '//fonts.googleapis.com/';

return [

	'always_load_groups' => [
		'default' => [
			'main',
			'fonts',
		],
	],

	'groups' => [
		'admin' => [
			$static_css.'admin.css'
		],
		'widget_play' => [
			$static_css.'play.css',
			$static_css.'ng-modal.css'
		],
		'lti' => [
			$static_css.'main.css',
			$static_css.'lti.css',
		],
		'my_widgets' => [
			$static_css.'my_widgets.css',
			$cdnjs.'jqPlot/1.0.9/jquery.jqplot.min.css',
			$static_css.'ui-lightness/jquery-ui-1.8.21.custom.css',
			$static_css.'ui-lightness/jquery-ui-timepicker-addon.css',
			$static_css.'jquery.dataTables.css',
			$static_css.'ng-modal.css'
		],
		'widget_editor' => [
			$static_css.'create.css',
			$static_css.'ng-modal.css'
		],
		'widget_detail' => [
			$cdnjs.'fancybox/1.3.4/jquery.fancybox-1.3.4.css',
			$static_css.'widget.css',
		],
		'widget_catalog' => [
			$static_css.'catalog.css',
		],
		'profile' => [
			$static_css.'user.css',
		],
		'login' => [
			$static_css.'login.css',
		],
		'scores' => [
			$cdnjs.'jqPlot/1.0.9/jquery.jqplot.min.css',
			$static_css.'scores.css',
		],
		'embed_scores' => [
			$static_css.'scores.css',
		],
		'question_catalog' => [
			$static_css.'jquery.dataTables.css',
			$static_css.'question-import.css',
		],
		'media_catalog' => [
			$static_css.'jquery.dataTables.css',
			$static_css.'media-import.css'
		],
		'help' => [
			$static_css.'docs.css',
		],
		'404' => [
			$static_css.'404.css',
		],
		'500' => [
			$static_css.'500.css',
		],
		'core' => [
			$static_css.'main.css',
		],
		'upload' => [
			$static_css.'upload.css',
		],
		'fonts' => [
			$g_fonts.'css?family=Kameron:700&text=0123456789%25',
			$g_fonts.'css?family=Lato:300,400,700,700italic,900&amp;v2',
		],
	],
];
