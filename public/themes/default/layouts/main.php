<!DOCTYPE html>

<html class="<?= (isset($html_class) ? $html_class : '') ?>">
<!--[if lt IE 9]>
<html class="<?= (isset($html_class) ? $html_class : '') ?> ie8">
<![endif]-->
<!--[if IE 9]>
<html class="<?= (isset($html_class) ? $html_class : '') ?> ie9">
<![endif]-->

<head>
<!-- <base href="/" /> -->
<meta charset="utf-8" />
<title><?= $title ?> | Materia</title>
<?= Css::render() ?>
<?= Js::render() ?>
</head>
	<body class="<?= (isset($page_type) ? $page_type : '') ?>" ng-app="materia">
	<?= (isset($partials['header']) ? $partials['header'] : '' ) ?>
	<?= $partials['content'] ?>
	</body>
</html>
