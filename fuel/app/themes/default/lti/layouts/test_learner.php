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
		var $form = document.querySelector('#form');

		for(var attr in postData)
		{
			input = document.createElement("input");
			input.setAttribute("type", "hidden");
			input.setAttribute("name", attr);
			input.setAttribute("value", postData[attr]);
			$form.append(input);
		}

		$form.submit();
	</script>
</html>
