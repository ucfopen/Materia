<?
	return [
		// TURN OFF COMBINING AND MINIFY-ING
		'min' => false,
		'combine' => false,

		// TURN OFF THE GOOGLE FONT REQUIRMENTS
		'groups' => [
			'css' => [

				'fonts' => [
					'enabled' => false,
					'combined' => false,
					'min' => false,
					'files' => [],
					'attr' => ['data-src' => 'fonts'],
				],
			],
		],
	];