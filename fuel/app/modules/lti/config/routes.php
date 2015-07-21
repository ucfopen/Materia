<?
return [
	'play?'           => 'widgets/play_widget/$1',  // necessary for LTI posts
	'embed/?'         => 'widgets/play_embedded/',  // necessary for LTI posts
	'lti/assignment?' => 'widgets/play_embedded/$1' // legacy LTI url
];
