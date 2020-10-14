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
		<p class="note">Preview restricted by widget permissions in Materia.</p>
		<p>To view the widget in Canvas as a student, view the assignment while in <a href="https://webcourses.ucf.edu/profile/settings" target="_blank" class="external">Student View</a>.</p>
	</div>
</section>
