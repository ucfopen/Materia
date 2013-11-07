<?
$id = '(?<id>\d+)';
$clean_name = '(?<clean_name>[a-zA-Z0-9_\-]+)';
return [

	"sandbox/$id-$clean_name/create(/.*)?"  => 'widgets/develop/create', // Development version of widgets/create
	"sandbox/$id-$clean_name/demo"          => 'widgets/develop/play_demo', // Development version of widgets/play_demo
	"sandbox/$id-$clean_name/dump"          => 'widgets/develop/dump', // Development version of widgets/detail
	"sandbox/$id-$clean_name"               => 'widgets/develop/detail', // Development version of widgets/detail

	"test/external/(:alnum)(/.*)?"          => "widgets/test/external/$1"

];