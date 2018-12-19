<!DOCTYPE html>
<html class="<?= (isset($html_class) ? $html_class : '') ?>" lang="en">
<head>
<meta charset="utf-8" />
<?= (isset($partials['meta']) ? $partials['meta'] : '' ) ?>
<title><?= $title ?> | Materia</title>
<?= Css::render() ?>
<?= Js::render() ?>
<?= (isset($partials['google_analytics']) ? $partials['google_analytics']: '' ) ?>
</head>
	<body class="<?= (isset($page_type) ? $page_type : '') ?>" ng-app="materia">
		<?= (isset($partials['header']) ? $partials['header'] : '' ) ?>
		<?= $partials['content'] ?>
		<?= (isset($partials['footer']) ? $partials['footer'] : '' ) ?>
	</body>
</html>
