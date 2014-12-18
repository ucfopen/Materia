<?php
return [
	'paths' => [
		'gfonts' => '//fonts.googleapis.com/',
		'theme'  => '/themes/default/assets/css/',
		'lib'  => '/assets/css/',
	],

	'always_load_groups' => [
		'default' => [
			'main',
			'fonts',
		],
	],

	'groups' => [
		'widget_play' => [
			'theme::play.css',
		],
		'lti' => [
			'theme::main.css',
			'theme::lti.css',
		],
		'my_widgets' => [
			'theme::my_widgets.css',
			'jquery.jqplot.min.css',
			'ui-lightness/jquery-ui-1.8.21.custom.css',
			'ui-lightness/jquery-ui-timepicker-addon.css',
			'jquery.dataTables.css',
			'lib::../js/lib/bower/ngModal/dist/ng-modal.css'
		],
		'widget_editor' => [
			'theme::create.css',
		],
		'widget_detail' => [
			'lib::jquery.fancybox-1.3.4.css',
			'theme::widget.css',
		],
		'widget_catalog' => [
			'theme::catalog.css',
		],
		'profile' => [
			'theme::user.css',
		],
		'login' => [
			'theme::login.css',
		],
		'scores' => [
			'lib::jquery.jqplot.min.css',
			'theme::scores.css',
		],
		'embed_scores' => [
			'theme::scores_embedded.css',
		],
		'question_catalog' => [
			'lib::jquery.dataTables.css','theme::question-import.css',
		],
		'media_catalog' => [
			'lib::jquery.dataTables.css',
			'lib::jquery.plupload.queue.css',
			'theme::media-import.css'
		],
		'homepage' => [
			'theme::store.css',
			'theme::widget.css',
		],
		'help' => [
			'theme::docs.css',
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
