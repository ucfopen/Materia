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
		'homepage' => [$webpack.'js/homepage.css'],
		'admin' => [$webpack.'css/admin.css'],
		'user-admin' => [$webpack.'js/user-admin.css'],
		'support' => [$webpack.'js/support.css'],
		'catalog' => [$webpack.'js/catalog.css'],
		'detail' => [$webpack.'js/detail.css'],
		'playpage' => [$webpack.'js/player-page.css'],
		'lti' => [$webpack.'css/util-lti-picker.css'],
		'my_widgets'  => [$webpack.'js/my-widgets.css'],
		'widget_create' => [
			$webpack.'css/loading-icon.css',
			$webpack.'js/creator-page.css',
		],
		'widget_detail' => [
			$webpack.'css/widget-detail.css',
		],
		'widget_catalog' => [$webpack.'css/widget-catalog.css'],
		'profile' => [$webpack.'js/profile.css'],
		'login' => [$webpack.'js/login.css'],
		'scores' => [
			$cdnjs.'jqPlot/1.0.9/jquery.jqplot.min.css',
			$webpack.'js/scores.css',
		],
		'pre_embed_placeholder' => [$webpack.'js/pre-embed-common-styles.css'],
		'embed_scores' => [$webpack.'css/scores.css'],
		'question_import' => [
			$vendor.'jquery.dataTables.min.css',
			$webpack.'css/util-question-import.css',
			$webpack.'css/question-importer.css',
		],
		'questionimport' => [$webpack.'js/question-importer.css'],
		'qset_history' => [
			$webpack.'css/util-qset-history.css',
		],
		'rollback_dialog' => [
			$webpack.'css/util-rollback-confirm.css'
		],
		'media_import' => [$webpack.'js/media.css'],
		'help' => [$webpack.'css/help.css'],
		'errors' => [$webpack.'css/errors.css'],
		'fonts' => [
			$g_fonts.'css2?family=Kameron:wght@700&display=block',
			$g_fonts.'css2?family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,700&display=block',
		],
		'guide' => [$webpack.'css/guide-page.css'],
		// the following are required for the support-info styles to be embedded
		// TODO probably consolidate the support_info styles in a common stylesheet
		'draft-not-playable' => [$webpack.'js/draft-not-playable.css'],
		'500' => [$webpack.'js/500.css'],
		'no_permission' => [$webpack.'js/no-permission.css']
	],
];