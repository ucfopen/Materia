<header>
	<h1><?= $title ?></h1>
	<div id="logo"></div>
</header>

<section id="error-container">
	<p>This assignment has guest mode enabled.</p>
	<p>Your instructor will need to git gud.</p>

	<?= Theme::instance()->view('partials/help/support_info') ?>
</section>
