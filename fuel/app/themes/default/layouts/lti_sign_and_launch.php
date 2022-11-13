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
		<p>Signed request created, sending</p>
		<form id="form" method="POST">
		</form>
	</body>
	<script type="text/javascript">
		const postData = <?= $post ?>;
		const formEl = document.getElementById('form');
		formEl.action = postData.endpoint;

		for(var attr in postData)
		{
			const i = document.createElement('input');
			i.type = 'text';
			i.name = attr;
			i.value = postData[attr];
			formEl.appendChild(i);
		}

		formEl.submit();
	</script>
</html>
