<header>
	<h1><?= $title ?></h1>
	<div id="logo"></div>
</header>

<section id="error-container">
	<p>An error occured.</p>

	<p>If you need help accessing this tool, contact support.</p>

	<?= Theme::instance()->view('partials/help/support_info') ?>
</section>