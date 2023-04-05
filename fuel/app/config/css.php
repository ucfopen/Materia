<?php
$webpack = \Config::get('materia.urls.js_css');
$vendor = \Config::get('materia.urls.js_css').'vendor/';
$cdnjs = '//cdnjs.cloudflare.com/ajax/libs/';
$g_fonts = '//fonts.googleapis.com/';

return [

	'always_load_groups' => [
		'default' => [
			'main',
			'fonts',
		],
	],

	'groups' => [
		'homepage' => [$webpack.'css/homepage.css'],
		'user-admin' => [$webpack.'css/user-admin.css'],
		'support' => [$webpack.'css/support.css'],
		'catalog' => [$webpack.'css/catalog.css'],
		'detail' => [$webpack.'css/detail.css'],
		'playpage' => [$webpack.'css/player-page.css'],
		'lti' => [$webpack.'css/util-lti-picker.css'],
		'my_widgets'  => [$webpack.'css/my-widgets.css'],
		'widget_create' => [
			$webpack.'css/loading-icon.css',
			$webpack.'css/creator-page.css',
		],
		'profile' => [$webpack.'css/profile.css'],
		'login' => [$webpack.'css/login.css'],
		'scores' => [$webpack.'css/scores.css'],
		'pre_embed_placeholder' => [$webpack.'css/pre-embed-common-styles.css'],
		'embed_scores' => [$webpack.'css/scores.css'],
		'question_import' => [
			$vendor.'jquery.dataTables.min.css',
			$webpack.'css/util-question-import.css',
			$webpack.'css/question-importer.css',
		],
		'questionimport' => [$webpack.'css/question-importer.css'],
		'qset_history' => [$webpack.'css/qset-history.css'],
		'rollback_dialog' => [$webpack.'css/util-rollback-confirm.css'],
		'media_import' => [$webpack.'css/media.css'],
		'help' => [$webpack.'css/help.css'],
		'fonts' => [
			$g_fonts.'css2?family=Kameron:wght@700&display=block',
			$g_fonts.'css2?family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,700&display=block',
		],
		'guide' => [$webpack.'css/guides.css'],
		'draft-not-playable' => [$webpack.'css/draft-not-playable.css'],
		'404' => [$webpack.'css/404.css'],
		'500' => [$webpack.'css/500.css'],
		'no_permission' => [$webpack.'css/no-permission.css']
	],
];