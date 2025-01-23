<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width,initial-scale=1.0">
		<?= $partials['meta'] ?? '' ?>
		<title><?= $title ?? '' ?> | Materia</title>
		<link rel="icon" href="/favicon-32.png" sizes="32x32">
		<link rel="icon" href="/favicon-128.png" sizes="128x128">
		<link rel="icon" href="/favicon-180.png" sizes="180x180">
		<link rel="icon" href="/favicon-192.png" sizes="192x192">
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<?= Css::render() ?>
		<?=  $partials['google_analytics'] ?? '' ?>
	</head>
	<body class="<?= (isset($page_type) ? $page_type : '') ?> <?= (isset($darkmode) ? 'darkMode' : '') ?>">
		<div id="app"></div>
		<div id="modal"></div>
		<?= Js::render() ?>
	</body>
</html>
