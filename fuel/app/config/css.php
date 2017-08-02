<?php
return [
	'hash_file' => 'asset_hash.css.json',
	'paths' => [
		'gfonts' => '//fonts.googleapis.com/',
		'cdnjs' => '//cdnjs.cloudflare.com/ajax/libs/',
		'static' => '//localhost:8008/css/',
	],

	'always_load_groups' => [
		'default' => [
			'main',
			'fonts',
		],
	],

	'groups' => [
		'widget_play' => [
			'static::play.css',
			'static::../js/vendor/ngmodal/ng-modal.css'
		],
		'lti' => [
			'static::main.css',
			'static::lti.css',
		],
		'my_widgets' => [
			'static::my_widgets.css',
			'cdnjs::jqPlot/1.0.0/jquery.jqplot.min.css',
			'static::ui-lightness/jquery-ui-1.8.21.custom.css',
			'static::ui-lightness/jquery-ui-timepicker-addon.css',
			'static::jquery.dataTables.css',
			'static::../js/vendor/ngmodal/ng-modal.css'
		],
		'widget_editor' => [
			'static::create.css',
			'static::../js/vendor/ngmodal/ng-modal.css'
		],
		'widget_detail' => [
			'static::vendor/fancybox/jquery.fancybox.css',
			'static::widget.css',
		],
		'widget_catalog' => [
			'static::catalog.css',
		],
		'profile' => [
			'static::user.css',
		],
		'login' => [
			'static::login.css',
		],
		'scores' => [
			'cdnjs::jqPlot/1.0.0/jquery.jqplot.min.css',
			'static::scores.css',
		],
		'embed_scores' => [
			'static::scores.css',
		],
		'question_catalog' => [
			'static::jquery.dataTables.css','static::question-import.css',
		],
		'media_catalog' => [
			'static::jquery.dataTables.css',
			'cdnjs::plupload/1.5.4/jquery.plupload.queue/css/jquery.plupload.queue.css',
			'static::media-import.css'
		],
		'homepage' => [
			'static::store.css',
			'static::widget.css',
		],
		'help' => [
			'static::docs.css',
		],
		'404' => [
			'static::404.css',
		],
		'500' => [
			'static::500.css',
		],
		'core' => [
			'static::main.css',
		],
		'upload' => [
			'static::upload.css',
		],
		'fonts' => [
			'gfonts::css?family=Kameron:700&text=0123456789%25',
			'gfonts::css?family=Lato:300,400,700,700italic,900&amp;v2',
		],
	],
];
