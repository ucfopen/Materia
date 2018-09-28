<?php
// all files in heroku/config are copied to config/production on heroku
// they will overwrite any files already in config/production
return [
	'legacy' => [
		'crypto_key' => $_ENV['CRYPTO_KEY'],
		'crypto_iv' => $_ENV['CRYPTO_IV'],
		'crypto_hmac' => $_ENV['CRYPTO_HMAC'],
	],
	'sodium' => [
		'cipherkey' => $_ENV['CIPHER_KEY'],
	],
];
