<?php
return [
	'paths' => [
		'gfonts' => 'https://fonts.googleapis.com/',
		'theme'  => '/themes/default/assets/css/',
	],

	'always_load_groups' => [
		'default' => [
			'main',
			'fonts',
		],
	],

	'groups' => [
		'widget_play' => [
			'play.css',
		],
		'my_widgets' => [
			'my_widgets.css',
			'jquery.jqplot.min.css',
			'ui-lightness/jquery-ui-1.8.21.custom.css',
			'ui-lightness/jquery-ui-timepicker-addon.css',
			'jquery.dataTables.css'
		],
		'widget_editor' => [
			'create.css',
		],
		'widget_detail' => [
			'jquery.fancybox-1.3.4.css',
			'theme::widget.css',
		],
		'widget_catalog' => [
			'theme::catalog.css',
		],
		'profile' => [
			'user.css',
		],
		'login' => [
			'login.css',
		],
		'scores' => [
			'jquery.jqplot.min.css', 'scores.css',
		],
		'embed_scores' => [
			'jquery.jqplot.min.css', 'scores_embedded.css',
		],
		'question_catalog' => [
			'jquery.dataTables.css','question-import.css',
		],
		'media_catalog' => [
			'jquery.dataTables.css',
			'jquery.plupload.queue.css',
			'media-import.css'
		],
		'homepage' => [
			'store.css','widget.css',
		],
		'help' => [
			'docs.css',
		],
		'404' => [
			'404.css',
		],
		'core' => [
			'theme::main.css',
		],
		'fonts' => [
			'gfonts::css?family=Kameron:700&text=0123456789%25',
			'gfonts::css?family=Lato:300,400,700,700italic,900&amp;v2',
		],
	],
];
