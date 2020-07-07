<?php
return [
  'sodium' => [
    'cipherkey' => $_ENV['CIPHER_KEY']
  ],
  'legacy' => [
    'crypto_key' => $_ENV['CRYPTO_KEY'] ?? null,
    'crypto_iv' => $_ENV['CRYPTO_IV'] ?? null,
    'crypto_hmac' => $_ENV['CRYPTO_HMAC'] ?? null,
  ],
];
