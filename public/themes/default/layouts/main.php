<!DOCTYPE html>

<!--[if lt IE 9]>
<html class="ie8">
<![endif]-->
<!--[if IE 9]>
<html class="ie9">
<![endif]-->

<head>
<meta charset="utf-8" />
<title><?= $title ?> | Materia</title>
<?= Casset::render() ?>
<?= Casset::render_js_inline() ?>
<!--[if lt IE 9]>
	<?
		\Casset::css('ie8.css', false, 'ie');
		echo \Casset::render('ie');
	?>
	<script type="text/javascript">
		var ie8Browser = true;
	</script>
<![endif]-->
<!--[if gte IE 9]>
	<style type="text/css">
	.gradient {filter: none;}
	</style>
<![endif]-->
<!--[if IE 9]>
	<script type="text/javascript">
		var ie9Browser = true;
	</script>
<![endif]-->
</head>
	<body class="<? if (isset($page_type)) { echo $page_type; } else { echo(''); } ?>" ng-app="materiaApp">
	<? if ( isset($partials['header']) ) { echo $partials['header']; } ?>
	<?= $partials['content'] ?>
	</body>
</html>
