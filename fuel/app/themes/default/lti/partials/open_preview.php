<header>
	<h1>Materia Widget Embedded</h1>
	<div id="logo"></div>
</header>
<section>
	<?php if(!$current_user_owns): ?>
		<script type="text/javascript">

			const requested = []

			const requestAccess = (owner_id) => {

				if (requested[owner_id]) return

				let req = new XMLHttpRequest()
				req.open('POST', '/api/instance/request_access')
				req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
				req.send(`inst_id=${inst_id}&owner_id=${owner_id}`)
				
				let el = document.getElementById(`owner-${owner_id}`)
				el.setAttribute('disabled', 'disabled')
				el.className = 'button disabled'

				requested[owner_id] = true
			}
		</script>
		<div class="container not_an_owner">
			<div class="widget_info">
				<div class="widget_icon">
					<img src="<?= $icon ?>" alt="<?= $widget_name ?> Type Widget Icon">
				</div>
				<div class="widget_name"><?= $inst_name ?></div>
			</div>
			<h3>You don't own this widget!</h3>
			<p>You may contact one of the widget owners listed below to request access to this widget. Clicking the Request Access option will notify them and provide them the option to add you as a collaborator.</p>
			<ul>
				<?php foreach($instance_owner_list as $owner):?>
					<li class="instance_owner">
						<?= $owner->first.' '.$owner->last ?>
						<a id="owner-<?= $owner->id ?>" class="button request_widget_access" onclick="requestAccess(<?= $owner->id ?>)">Request Access</a>
					</li>
				<?php endforeach; ?>
			</ul>
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
