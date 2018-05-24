<?php

return [
	'driver' => [
		'Materiaauth',
		// Add auth drivers to use SAML, or something custom
	],

	'restrict_logins_to_lti_single_sign_on' => false,
	// Use your own salt for security reasons
	'salt' => 'SET THIS IN YOUR ENV CONFIG',
];
