<?php
// setup more specific regex matches with names
$id = '(?<id>\d+)';
$clean_name = '(?<clean_name>[a-zA-Z0-9_\-]+)';
$play_id = '([a-zA-Z0-9_\-]+)';

return [
	// ================================= MISC ======================================

	'_403_'             => 'site/403',
	'_404_'             => 'site/404',
	'_500_'             => 'site/500',
	'_root_'            => 'site/index',  // Homepage
	'permission-denied' => ['site/permission_denied', 'name' => 'nopermission'],
	'crossdomain'       => 'site/crossdomain',
	'help'              => ['site/help', 'name' => 'help'],    // The main docs page

	// ================================= API ======================================

	'api/json/:method' => 'api/call/1/json/$1', // JSON API GATEWAY

	// ================================= WIDGETS ======================================

	"widgets/$id-$clean_name/create(/.*)?" => 'widgets/create',
	"widgets/$id-$clean_name/demo"         => 'widgets/play_demo', // each widget engine has a demo game made in it - this is a shortcut to it
	"widgets/$id-$clean_name"              => 'widgets/detail', // details of the widget engine
	"widgets/$id-$clean_name/(players|creators)-guide"  => 'widgets/guide/$3', // guide pages
	'widgets/all'                          => 'widgets/all', // catalog page, with optional display option(s)
	'widgets'                              => ['widgets/index', 'name' => 'catalog'], // catalog of all the widget engines
	'my-widgets'                           => 'widgets/mywidgets/',

	'edit/(:alnum)(/.*)?'                  => 'widgets/edit/$1',
	'play/(:alnum)(/.*)?'                  => 'widgets/play_widget/$1',
	'preview/(:alnum)(/.*)?'               => 'widgets/preview_widget/$1',
	'preview-embed/(:alnum)(/.*)?'         => 'widgets/play_embedded_preview/$1',
	'embed/(:alnum)(/.*)?'                 => 'widgets/play_embedded/$1',
	'lti/assignment?'                      => 'widgets/play_embedded/$1', // legacy LTI url

	'data/export/(:alnum)'                 => 'data/export/$1',
	"scores/single/{$play_id}/(:alnum)(/.*)?"  => 'scores/single/$1/$2',
	'scores/preview/(:alnum)(/.*)?'        => 'scores/show/$1', // legacy
	'scores/preview-embed/(:alnum)(/.*)?'  => 'scores/show_embedded/$1',
	'scores/embed/(:alnum)(/.*)?'          => 'scores/show_embedded/$1',
	'scores/semesters?'                    => 'scores/semesters',
	'scores/(:alnum)(/.*)?'                => 'scores/show/$1',

	// ================================= MEDIA ======================================

	'media/import'             => 'media/import',
	'media/upload'             => 'media/upload',
	'media/(:alnum)'           => 'media/render/$1',
	'media/(:alnum)/thumbnail' => 'media/render/$1/thumbnail',
	'media/(:alnum)/large'     => 'media/render/$1/large',

	// ================================= USER ======================================

	'settings' => [['GET', new Route('users/settings')], ['POST', new Route('users/update')]],
	'login'    => ['users/login', 'name' => 'login'],
	'profile'  => ['users/profile/', 'name' => 'profile'],
];
