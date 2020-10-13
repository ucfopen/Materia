<?php

return [
	'driver' => explode(',', ($_ENV['AUTH_DRIVERS'] ?? 'Materiaauth')),

	'restrict_logins_to_lti_single_sign_on' => $_ENV['BOOL_LTI_RESTRICT_LOGINS_TO_LAUNCHES'] ?? false,
	// Use your own salt for security reasons
	'salt' => $_ENV['AUTH_SALT'],
];
