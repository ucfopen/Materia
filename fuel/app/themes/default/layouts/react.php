<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<?= $partials['meta'] ?? '' ?>
		<title><?= $title ?? '' ?> | Materia</title>
		<?= Css::render() ?>
		<?=  $partials['google_analytics'] ?? '' ?>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body>
		<div id="app"></div>
		<div id="modal"></div>
		<?= Js::render() ?>
	</body>
</html>
