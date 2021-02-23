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
			$static_css.'widget-play.css',
			$static_css.'ng-modal.css'
		],
		'lti' => [
			$static_css.'util-lti-picker.css',
		],
		'my_widgets' => [
			$static_css.'my-widgets.css',
			$cdnjs.'jqPlot/1.0.9/jquery.jqplot.min.css',
			$static_css.'ui-lightness/jquery-ui-1.8.21.custom.css',
			$static_css.'jquery.dataTables.css',
			$static_css.'ng-modal.css'
		],
		'widget_create' => [
			$static_css.'widget-create.css',
			$static_css.'ng-modal.css'
		],
		'widget_detail' => [
			$static_css.'widget-detail.css',
			$static_css.'ng-modal.css'
		],
		'widget_catalog' => [
			$static_css.'widget-catalog.css',
		],
		'profile' => [
			$static_css.'profile.css',
		],
		'login' => [
			$static_css.'login.css',
		],
		'scores' => [
			$cdnjs.'jqPlot/1.0.9/jquery.jqplot.min.css',
			$static_css.'scores.css',
		],
		'pre_embed_placeholder' => [
			$static_css.'widget-embed-placeholder.css'
		],
		'embed_scores' => [
			$static_css.'scores.css',
		],
		'question_import' => [
			$static_css.'jquery.dataTables.css',
			$static_css.'util-question-import.css',
		],
		'qset_history' => [
			$static_css.'util-qset-history.css',
		],
		'rollback_dialog' => [
			$static_css.'util-rollback-confirm.css'
		],
		'media_import' => [
			$static_css.'util-media-import.css'
		],
		'help' => [
			$static_css.'help.css',
		],
		'errors' => [
			$static_css.'errors.css',
		],
		'core' => [
			$static_css.'core.css',
		],
		'fonts' => [
			$g_fonts.'css?family=Kameron:700&text=0123456789%25',
			$g_fonts.'css?family=Lato:300,400,700,700italic,900&amp;v2',
		],
		'guide' => [
			$static_css.'widget-guide.css',
		],
	],
];
