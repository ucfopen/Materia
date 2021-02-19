<header>
	<h1>Materia Widget Embedded</h1>
	<div id="logo"></div>
</header>
<section>
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
		<p class="note">Ability to preview is restricted by permissions in Materia.</p>
		<?php if ( ! empty($owner_names)): ?>
			<p class="note">Materia users with management access:  <?= $owner_names ?></p>
		<?php endif ?>

		<p>Embedding in Canvas? View the assignment as a student using <a href="https://webcourses.ucf.edu/profile/settings" target="_blank" class="external">Student View</a>.</p>
	</div>
</section>
