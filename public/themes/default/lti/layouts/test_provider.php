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
			$(function() {
				if(typeof window.localStorage !== 'undefined' && typeof localStorage.ltiUrl !== 'undefined')
				{
					document.getElementById('assignment-url').value = localStorage.ltiUrl;
				}
			});

			function toggleVariableWidthIFrame()
			{
				var iframe = document.getElementById('embed_iframe');
				if(typeof __iframeInitWidth === 'undefined')
				{
					__iframeInitWidth = iframe.width;
				}
				var variableWidth = document.getElementById('variable_iframe').checked;
				iframe.width = variableWidth ? '100%' : __iframeInitWidth;
			}

			function onIFrameLoad()
			{
				var iframe = document.getElementById('embed_iframe');
				var returnUrl = iframe.contentWindow.location.href;

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

			function setLtiUrl(form)
			{
				$(form).find('.lti_url').val($('#assignment-url').val());
				$(form).find('.resource_link').val($('#resource-link-id').val());
				$(form).find('.custom_widget_instance_id').val($('#custom-inst-id').val());
			}

			function createLearnerButtons(event)
			{
				event.returnValue = false;
				return false;
			}
		</script>
	</head>
	<body>
		<header>
			<h1>Use materia as an LTI Provider (inserted into another system)</h1>
		</header>
		<section>
			<p>This page will act as an LMS sending an LTI request to Materia.</p>
			<div>
				<label><input onclick="toggleVariableWidthIFrame()" type="checkbox" id="variable_iframe" />Variable width iframe</label>
			</div>

			<iframe name="embed_iframe" id="embed_iframe" width="700px" height="600px" onLoad="onIFrameLoad()"></iframe>

			<form method="POST" target="embed_iframe" action="<?= $instructor_endpoint ?>" >
				<? foreach ($instructor_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<? endforeach ?>
				<input type="submit" value="As Instructor">
			</form>

			<form method="POST" target="embed_iframe" action="<?= $new_instructor_endpoint ?>" >
				<? foreach ($new_instructor_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<? endforeach ?>
				<input type="submit" value="As NEW Instructor">
			</form>

			<hr />

			<div>
				<span>
					LTI Assignment URL:
				</span>
				<input id="assignment-url" style="width:400px;" type="text"></input>
			</div>

			<div>
				<span>
					Resource Link ID:
				</span>
				<input id="resource-link-id" style="width:400px;" type="text" value="test-resource"></input>
			</div>

			<div>
				<span>
					[Custom Inst ID (POST)]:
				</span>
				<input id="custom-inst-id" style="width:400px;" type="text"></input>
			</div>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="submit" value="As Learner">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" id="new_learner" name="new_learner" value="new_learner" />
				<input type="submit" value="As NEW Learner">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" id="test_student" name="test_student" value="test_student" />
				<input type="submit" value="As Test Student">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" id="as_instructor" name="as_instructor" value="as_instructor" />
				<input type="submit" id="play_as_instructor" value="As Instructor">
			</form>

			<hr />

			<form method="POST" target="embed_iframe" action="<?= $validation_endpoint ?>">
				<? foreach ($validation_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<? endforeach ?>
				<input type="submit" value="Test Validation">
			</form>

			<form method="POST" target="embed_iframe" action="<?= $unknown_role_endpoint ?>" >
				<? foreach ($unknown_role_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<? endforeach ?>
				<input type="submit" value="Unknown Role Error">
			</form>

			<form method="POST" target="embed_iframe" action="<?= $unknown_assignment_endpoint ?>" >
				<? foreach ($unknown_assignment_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<? endforeach ?>
				<input type="submit" id="test_unkown_assignment" value="Unknown Assignment Error">
			</form>
		</section>
	</body>
</html>
