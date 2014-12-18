<!DOCTYPE html>

<!--[if lt IE 9]>
<html class="ie8">
<![endif]-->
<!--[if IE 9]>
<html class="ie9">
<![endif]-->

<head>
<!-- <base href="/" /> -->
<meta charset="utf-8" />
<title><?= $title ?> | Materia</title>
<?= Css::render() ?>
<?= Js::render() ?>
</head>
	<body class="<? if (isset($page_type)) { echo $page_type; } else { echo(''); } ?>" ng-app="materia">
	<? if ( isset($partials['header']) ) { echo $partials['header']; } ?>
	<?= $partials['content'] ?>
	</body>
</html>
