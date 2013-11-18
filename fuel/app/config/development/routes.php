<?
$id = '(?<id>\d+)';
$clean_name = '(?<clean_name>[a-zA-Z0-9_\-]+)';
return [

	"sandbox/$clean_name/create(/.*)?"  => 'widgets/sandbox/create', // Development version of widgets/create
	"sandbox/$clean_name/demo"          => 'widgets/sandbox/play_demo', // Development version of widgets/play_demo
	"sandbox/$clean_name/dump"          => 'widgets/sandbox/dump', // Development version of widgets/detail
	"sandbox/$clean_name"               => 'widgets/sandbox/detail', // Development version of widgets/detail

	"test/external/(:alnum)(/.*)?"          => "widgets/test/external/$1"

];