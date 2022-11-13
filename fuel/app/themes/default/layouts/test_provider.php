<!DOCTYPE html>
<html>
	<head>
		<title>Materia Test as Provider</title>
		<meta charset="utf-8" />
		<script type="text/javascript"></script>
		<style type="text/css"></style>
		<?= Css::render() ?>
		<?= Js::render() ?>
		<script type="text/javascript">
			function onIFrameLoad()
			{
				var iframe = document.getElementById('embed_iframe');
				var returnUrl = iframe.contentWindow.location.href;

				// if the url of the iframe matches to format used by Canvas's basic_lti picker
				// extract the url from the response
				if(returnUrl.indexOf('embed_type=basic_lti') > 0 && returnUrl.indexOf('url=') > 0)
				{
					var urlInput = document.getElementById('assignment-url');
					urlInput.value = returnUrl.substr(returnUrl.indexOf('url=') + 4);

					if(window.localStorage)
					{
						localStorage.ltiUrl = urlInput.value;
					}
				}
			}

			function updateCustomEndpoint()
			{
				const chosenEndpoint = document.querySelector('input[name="endpoint_select"]:checked').value;
				document.getElementById('endpoint').value = chosenEndpoint;

			}

		</script>
	</head>
	<body>
		<header>
			<h1>Test Materia LTI Launches</h1>
		</header>
		<section>
			<p>This page will act as an LMS sending an LTI request to Materia.  The Iframe below will show Materia's responses. Grab the corner to test resizing the iframe. </p>

			<iframe name="embed_iframe" id="embed_iframe"  onLoad="onIFrameLoad()" style="resize: both; overflow: auto" height="600" width="800" ></iframe>


			<hr />
			<?php
				foreach($launch_args as $section_name => $section)
				{
					echo "<h2>{$section_name}</h2>";
					foreach($section as $launch)
					{
						?>
						<a target="embed_iframe" href="/lti/test/sign_and_launch?<?php

						echo "endpoint={$launch['endpoint']}&";
						foreach ($launch['params'] as $name => $value)
						{
							echo("$name=$value&");
						}
						?>"><?= $launch['label'] ?></a> (<?= $launch['endpoint'] ?>)<br/>
					<?php
					}
				}
			?>
			<hr />
			<p>resource_link_id is used to determine which widget is linked to the current LMS's assignment/module/whatever.  The association is inserted into the lti table as soon as it can be.  Sometimes Canvas doesn't send the id when the instructor is choosing a widget.  As a result, we try to give the LMS a launch url that contains the inst id when possible.  Materia will attempt to choose the correct widget based on the lti table, the url, and the launch param custom-inst-id</p>
			<p>lti_message_type can change the behavior of the assignment launch url and picker.  Sending ContentItemSelectionRequest will tell both to display the picker and tell them how to return their params.</p>
			<form id="customForm"  method="GET" target="embed_iframe" action="<?= \URI::create('lti/test/sign_and_launch') ?>" >
			<div>
				<h2>Customized LTI Launch</h2>
				<div>URL TO SEND LTI POST REQUEST TO:</div>
				<?php
					foreach($endpoints as $key => $value)
					{
						echo '<input onchange="updateCustomEndpoint();" type="radio" id="radio_'.$key.'" name="endpoint_select" value="'.$value.'" /><label for="radio_'.$key.'">'. $key . '</label><br/>';
					}
				?>
				<input id="endpoint" name="endpoint" style="width:400px;" type="text"></input>
			</div>


			<?php
				foreach($base_params as $key => $value)
				{
					echo $key . ': <input type="text" name="'.$key.'" value="'.$value.'"/><br/>';
				}
			?>
				<input type="submit" value="Submit"/>
			</form>



		</section>
	</body>
</html>
