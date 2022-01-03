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
				$(form).find('.context_id').val($('#context-id').val());
				$(form).find('.resource_link').val($('#resource-link-id').val());
				$(form).find('.custom_widget_instance_id').val($('#custom-inst-id').val());
			}

			function createLearnerButtons(event)
			{
				event.returnValue = false;
				return false;
			}

			function toggleLegacy()
			{
				var url = $('#assignment-url').val();
				var isLegacy = url.indexOf('assignment') > -1;

				if(isLegacy) // http://localhost/lti/assignment?widget=nQXe5
				{
					var index = url.indexOf('/lti/');
					var instId = url.substr(index + 23, 7);
					$('#assignment-url').val(url.substring(0, index) + '/embed/' + instId);
				}
				else // http://localhost/embed/nQXe5/alt1 or http://localhost/play/nQXe5/alt1
				{
					if (url.indexOf('/embed/') > -1)
					{
						var index = url.indexOf('/embed/');
						var instId = url.substr(index + 7, 5);
					}
					else // http://localhost/play/nQXe5/alt1
					{
						var index = url.indexOf('/play/');
						var instId = url.substr(index + 6, 5);
					}

					$('#assignment-url').val(url.substring(0, index) + '/lti/assignment?widget=' + instId);
				}
			}

			function toggleEmbed()
			{
				var url = $('#assignment-url').val();
				var isEmbedded = url.indexOf('/embed/') > -1;

				if(isEmbedded) // http://localhost/embed/nQXe5/alt1
				{
					$('#assignment-url').val(url.replace('/embed/', '/play/'));
				}
				else if (url.indexOf('/play/' > -1)) // http://localhost/play/nQXe5/alt1
				{
					$('#assignment-url').val(url.replace('/play/', '/embed/'));
				}
				else // http://localhost/lti/assignment?widget=nQXe5
				{
					return; // do nothing if legacy url
				}
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

			<hr />

			<h2>LTI Navigation Launch</h2>

			<form method="POST" target="embed_iframe" action="<?= $login_endpoint ?>" >
				<?php foreach ($login_params as $name => $value) : ?>
					<? if($name == 'oauth_signature') : ?>
						<?= \Form::hidden('oauth_signature', 'THIS_WILL_FAIL') ?>
					<? else: ?>
					 	<?= \Form::hidden($name, $value) ?>
					<? endif ?>
				<?php endforeach ?>
				<input type="submit" value="Launch as instructor (bad signature)">
			</form>

			<?php // @codingStandardsIgnoreStart ?>
			<form method="POST" target="embed_iframe" action="<?= $login_endpoint ?>" >
				<?php foreach ($login_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<?php endforeach ?>
				<input type="submit" value="Launch as instructor">
			</form>

			<hr />
			<h2>LTI Picker Launch</h2>

			<form method="POST" target="embed_iframe" action="<?= $instructor_endpoint ?>" >
				<?php foreach ($instructor_params as $name => $value) : ?>
					<? if($name == 'oauth_signature') : ?>
						<?= \Form::hidden('oauth_signature', 'THIS_WILL_FAIL') ?>
					<? else: ?>
					 	<?= \Form::hidden($name, $value) ?>
					<? endif ?>
				<?php endforeach ?>
				<input type="submit" value="Launch as Instructor (bad signature)">
			</form>

			<form method="POST" target="embed_iframe" action="<?= $instructor_endpoint ?>" >
				<?php foreach ($instructor_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<?php endforeach ?>
				<input type="submit" value="Launch as Instructor">
			</form>


			<form method="POST" target="embed_iframe" action="<?= $new_instructor_endpoint ?>" >
				<?php foreach ($new_instructor_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<?php endforeach ?>
				<input type="submit" value="Launch as New Instructor">
			</form>
			<?php //@codingStandardsIgnoreEnd ?>

			<hr />

			<div>
				<h2>LTI Assignment Launch</h2>
				<span>
					LTI Assignment URL:
				</span>
				<input id="assignment-url" style="width:400px;" type="text"></input>
				<button onclick="toggleLegacy()">Toggle Legacy URL</button>
				<button onclick="toggleEmbed()">Toggle Embed URL</button>
			</div>

			<div>
				<span>
					Context ID:
				</span>
				<input id="context-id" style="width:400px;" type="text" value="test-context"></input>
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
			<!--
				these tests work differently then the rest of the buttons - not sure why right now
				these just post a couple of options to /lti/test/learner
				then that route has some logic to create the all the oauth vars
				it renders those into a page and uses js to post them to the assignment
				I'd like all of these buttons to work the same - seems pretty odd they'd
				work differently.

				One of the advantages of this method is the signature is generated and timestamped
				when you click the button.  The other buttons on this page build the signature and timestamp
				when the page is loaded - so they can easily expire
			-->

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="context_id" name="context_id" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" class="resource_link" name="use_bad_signature" value="true" />
				<input type="submit" value="As Learner (bad signature)">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="context_id" name="context_id" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="submit" value="As Learner">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="context_id" name="context_id" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" id="new_learner_email" name="new_learner_email" value="new_learner_email" />
				<input type="submit" value="As NEW Learner WITH EMAIL">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="context_id" name="context_id" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" id="new_learner_no_email" name="new_learner_no_email" value="new_learner_no_email" />
				<input type="submit" value="As NEW Learner WITHOUT EMAIL">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="context_id" name="context_id" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" id="test_student" name="test_student" value="test_student" />
				<input type="submit" value="As Test Student">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="context_id" name="context_id" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" id="as_instructor" name="as_instructor" value="as_instructor" />
				<input type="submit" id="play_as_instructor" value="As Instructor">
			</form>

			<form onsubmit="setLtiUrl(this)" method="POST" target="embed_iframe" action="<?= $learner_endpoint ?>" >
				<input type="hidden" class="lti_url" name="lti_url" />
				<input type="hidden" class="context_id" name="context_id" />
				<input type="hidden" class="resource_link" name="resource_link" />
				<input type="hidden" class="custom_widget_instance_id" name="custom_widget_instance_id" />
				<input type="hidden" id="as_instructor2" name="as_instructor2" value="as_instructor2" />
				<input type="submit" id="play_as_instructor2" value="As New Instructor">
			</form>

			<hr />
			<h2>Other</h2>

			<?php // @codingStandardsIgnoreStart ?>
			<form method="POST" target="embed_iframe" action="<?= $validation_endpoint ?>">
				<?php foreach ($validation_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<?php endforeach ?>
				<input type="submit" value="Test Validation">
			</form>

			<form method="POST" target="embed_iframe" action="<?= $validation_endpoint ?>">
				<?php foreach ($validation_params as $name => $value) : ?>
					<? if($name == 'oauth_signature') : ?>
						<?= \Form::hidden('oauth_signature', 'THIS_WILL_FAIL') ?>
					<? else: ?>
						<?= \Form::hidden($name, $value) ?>
					<? endif ?>
				<?php endforeach ?>
				<input type="submit" value="Test Validation (bad signature)">
			</form>

			<form method="POST" target="embed_iframe" action="<?= $unknown_assignment_endpoint ?>" >
				<?php foreach ($unknown_assignment_params as $name => $value) : ?>
				<?= \Form::hidden($name, $value) ?>
				<?php endforeach ?>
				<input type="submit" id="test_unkown_assignment" value="Unknown Assignment Error">
			</form>
			<?php //@codingStandardsIgnoreEnd ?>
		</section>
	</body>
</html>
