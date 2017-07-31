<?php
return [
	'hash_file' => 'asset_hash.css.json',
	'paths' => [
		'gfonts' => '//fonts.googleapis.com/',
		'theme'  => '/themes/default/assets/css/',
		'cdnjs' => '//cdnjs.cloudflare.com/ajax/libs/',
		'materia' => '//localhost:8008/assets/vendor/materia/css/',
		'static' => '//localhost:8008/assets/',
	],

	'always_load_groups' => [
		'default' => [
			'main',
			'fonts',
		],
	],

	'groups' => [
		'widget_play' => [
			'materia::play.css',
			'static::vendor/ngmodal/ng-modal.css'
		],
		'lti' => [
			'materia::main.css',
			'materia::lti.css',
		],
		'my_widgets' => [
			'materia::my_widgets.css',
			'cdnjs::jqPlot/1.0.0/jquery.jqplot.min.css',
			'static::css/ui-lightness/jquery-ui-1.8.21.custom.css',
			'static::css/ui-lightness/jquery-ui-timepicker-addon.css',
			'static::css/jquery.dataTables.css',
			'static::vendor/ngmodal/ng-modal.css'
		],
		'widget_editor' => [
			'materia::create.css',
			'static::vendor/ngmodal/ng-modal.css'
		],
		'widget_detail' => [
			'static::vendor/fancybox/jquery.fancybox.css',
			'materia::widget.css',
		],
		'widget_catalog' => [
			'materia::catalog.css',
		],
		'profile' => [
			'materia::user.css',
		],
		'login' => [
			'materia::login.css',
		],
		'scores' => [
			'cdnjs::jqPlot/1.0.0/jquery.jqplot.min.css',
			'materia::scores.css',
		],
		'embed_scores' => [
			'materia::scores.css',
		],
		'question_catalog' => [
			'static::css/jquery.dataTables.css','materia::question-import.css',
		],
		'media_catalog' => [
			'static::css/jquery.dataTables.css',
			'cdnjs::plupload/1.5.4/jquery.plupload.queue/jquery.plupload.queue.css',
			'materia::media-import.css'
		],
		'homepage' => [
			'materia::store.css',
			'materia::widget.css',
		],
		'help' => [
			'materia::docs.css',
		],
		'404' => [
			'materia::404.css',
		],
		'500' => [
			'materia::500.css',
		],
		'core' => [
			'materia::main.css',
		],
		'upload' => [
			'materia::upload.css',
		],
		'fonts' => [
			'gfonts::css?family=Kameron:700&text=0123456789%25',
			'gfonts::css?family=Lato:300,400,700,700italic,900&amp;v2',
		],
	],
];
