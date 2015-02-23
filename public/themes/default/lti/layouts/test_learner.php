<!DOCTYPE html>
<html>
	<head>
		<title>Materia Test as Provider</title>
		<meta charset="utf-8" />
		<style type="text/css"></style>
		<?= Css::render() ?>
		<?= Js::render() ?>
	</head>
	<body>
		<p>Loading...</p>
		<form id="form" method="POST" action="<?= $assignment_url ?>">
		</form>
	</body>
	<script type="text/javascript">
		var postData = JSON.parse('<?= $post ?>');
		var $form = $('#form');

		for(var attr in postData)
		{
			$form.append('<input type="hidden" name="' + attr + '" value="' + postData[attr] + '" />');
		}

		$form.submit();
	</script>
</html>
