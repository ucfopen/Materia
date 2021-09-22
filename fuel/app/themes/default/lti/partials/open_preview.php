<header>
	<h1>Materia Widget Embedded</h1>
	<div id="logo"></div>
</header>
<section>
	<?php if(!$current_user_owns): ?>
		<script type="text/javascript">
			const requestAccess = (owner_id) => {
				let req = new XMLHttpRequest()
				req.open('POST', '/api/instance/request_access')
				req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
				req.send(`inst_id=${inst_id}&owner_id=${owner_id}`)
			}
		</script>
		<div class="help-container">
			<div class="widget_info">
				<div class="widget_icon">
					<img src="<?= $icon ?>" alt="<?= $widget_name ?> Type Widget Icon">
				</div>
				<div class="widget_name"><?= $inst_name ?></div>
			</div>
			<p>You don't own this widget!</p>
			<p>Please contact one of the widget owners listed below to request access to this widget:</p>
			<ul>
				<?php foreach($instance_owner_list as $owner):?>
					<li>
						<?= $owner->first.' '.$owner->last ?>
						<button id="request_widget_access" onclick="requestAccess(<?= $owner->id ?>)">Request Access</button>
					</li>
				<?php endforeach; ?>
			</ul>

			<p>You may also request access to the widget by clicking the option below. The owner will receive a notification with the option to grant you access.</p>
		</div>
	<?php else: ?>

		<div class="container">
			<div class="widget_info">
				<div class="widget_icon">
					<img src="<?= $icon ?>" alt="<?= $widget_name ?> Type Widget Icon">
				</div>
				<div class="widget_name"><?= $inst_name ?></div>
			</div>
			<p>Students will see the widget instead of this message. When supported, Materia will synchronize scores.</p>
			<a class="button" href="<?= $preview_embed_url ?>">Start Preview</a>
		</div>

		<div class="help-container">
			<p class="note">Preview restricted by widget permissions in Materia.</p>
			<p>To view the widget in Canvas as a student, view the assignment while in <a href="https://webcourses.ucf.edu/profile/settings" target="_blank" class="external">Student View</a>.</p>
		</div>

	<?php endif; ?>
</section>
