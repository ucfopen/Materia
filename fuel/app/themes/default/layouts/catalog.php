<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<?= $partials['meta'] ?? '' ?>
		<title><?= $title ?? '' ?> | Materia</title>
		<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Kameron:700&text=0123456789%25">
		<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Lato:300,400,700,700italic,900&amp;v2">
		<link rel="stylesheet" href="//localhost:8080/catalog.css">
		<?=  $partials['google_analytics'] ?? '' ?>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body class="<?= $page_type ?? '' ?>" ng-app="materia">
		<div id="app"></div>
		<?= $partials['footer'] ?? '' ?>
		<script src="//unpkg.com/react@16.13.1/umd/react.development.js"></script>
		<script src="//unpkg.com/react-dom@16.13.1/umd/react-dom.development.js"></script>
		<script src="//localhost:8080/catalog.js"></script>
	</body>
</html>
