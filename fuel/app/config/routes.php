<?php
// setup more specific regex matches with names
$id = '(?<id>\d+)';
$clean_name = '(?<clean_name>[a-zA-Z0-9_\-]+)';
return [
	// ================================= MISC ======================================

	'_403_'             => 'site/403',
	'_404_'             => 'site/404',    // The main 404 route
	'_500_'             => 'site/500',    // The main 500 route
	'_root_'            => 'site/index',  // The default route
	'permission-denied' => ['site/permission_denied', 'name' => 'nopermission'],
	'crossdomain'       => 'site/crossdomain',

	// ================================= ADMIN ======================================
	'login/materia' => 'users/login/1',

	// ================================= API ======================================

	'api/json/:method' => 'api/call/1/json/$1', // JSON API GATEWAY

	// ================================= WIDGETS ======================================
	// NOTE: develop routes are in the development config

	"widgets/$id-$clean_name/create(/.*)?"  => 'widgets/create',
	"widgets/$id-$clean_name/demo"          => 'widgets/play_demo', // each widget engine has a demo game made in it - this is a shortcut to it
	"widgets/$id-$clean_name"               => 'widgets/detail', // details of the widget engine
	'widgets/(:type)'                       => 'widgets/index/$1', // catalog page, with optional display option(s)
	'widgets'                               => ['widgets/index', 'name' => 'catalog'], // catalog of all the widget engines
	'my-widgets'                            => 'widgets/mywidgets/',

	'edit/(:alnum)(/.*)?'                   => 'widgets/edit/$1',
	'play/(:alnum)(/.*)?'                   => 'widgets/play_widget/$1',
	'preview/(:alnum)(/.*)?'                => 'widgets/preview_widget/$1',
	'embed/(:alnum)(/.*)?'                  => 'widgets/play_embedded/$1',
	'lti/assignment?'                       => 'widgets/play_embedded/$1', // legacy LTI url

	'data/export/(:alnum)'                  => 'data/export/$1',

	'scores/preview/(:alnum)(/.*)?'         => 'scores/show/$1',
	'scores/embed/(:alnum)(/.*)?'           => 'scores/show_embedded/$1',
	'scores/semesters?'                     => 'scores/semesters',
	'scores/(:alnum)(/.*)?'                 => 'scores/show/$1',

	// ================================= DOCS ======================================

	'help' => ['site/help', 'name' => 'help'],    // The main docs page

	// ================================= QUESTIONS ======================================

	'questions'        => 'questions/index', // list all my questions
	'questions/import' => 'questions/import', // page for importing questions

	// ================================= MEDIA ======================================

	'media/import'             => 'media/import',
	'media/upload'             => 'media/upload',
	'media/(:alnum)'           => 'media/show_asset/$1',
	'media/(:alnum)/thumbnail' => 'media/show_thumnail/$1',
	'media/(:alnum)/large'     => 'media/show_large/$1',

	// ================================= USER ======================================

	'settings' => [['GET', new Route('users/settings')], ['POST', new Route('users/update')]],
	'login'    => ['users/login', 'name' => 'login'],
	'profile'  => ['users/profile/', 'name' => 'profile'],
];
