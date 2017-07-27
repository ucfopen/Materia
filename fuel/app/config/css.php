<?php
return [
	'hash_file' => 'asset_hash.css.json',
	'paths' => [
		'gfonts' => '//fonts.googleapis.com/',
		'theme'  => '/themes/default/assets/css/',
		'lib'  => '/assets/css/',
		'jslib' => '/assets/js/lib/',
		'cdnjs' => '//cdnjs.cloudflare.com/ajax/libs/',
	],

	'always_load_groups' => [
		'default' => [
			'main',
			'fonts',
		],
	],

	'groups' => [
		'admin' => [
			'theme::admin.css'
		],
		'widget_play' => [
			'theme::play.css',
			'jslib::ngmodal/ng-modal.css'
		],
		'lti' => [
			'theme::main.css',
			'theme::lti.css',
		],
		'my_widgets' => [
			'theme::my_widgets.css',
			'cdnjs::jqPlot/1.0.0/jquery.jqplot.min.css',
			'lib::ui-lightness/jquery-ui-1.8.21.custom.css',
			'lib::ui-lightness/jquery-ui-timepicker-addon.css',
			'lib::jquery.dataTables.css',
			'jslib::ngmodal/ng-modal.css'
		],
		'widget_editor' => [
			'theme::create.css',
			'jslib::ngmodal/ng-modal.css'
		],
		'widget_detail' => [
			'jslib::fancybox/jquery.fancybox.css',
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
			'cdnjs::jqPlot/1.0.0/jquery.jqplot.min.css',
			'theme::scores.css',
		],
		'embed_scores' => [
			'theme::scores.css',
		],
		'question_catalog' => [
			'lib::jquery.dataTables.css','theme::question-import.css',
		],
		'media_catalog' => [
			'lib::jquery.dataTables.css',
			'cdnjs::plupload/1.5.4/jquery.plupload.queue/jquery.plupload.queue.css',
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
			'theme::404.css',
		],
		'500' => [
			'theme::500.css',
		],
		'core' => [
			'theme::main.css',
		],
		'upload' => [
			'theme::upload.css',
		],
		'fonts' => [
			'gfonts::css?family=Kameron:700&text=0123456789%25',
			'gfonts::css?family=Lato:300,400,700,700italic,900&amp;v2',
		],
	],
];
