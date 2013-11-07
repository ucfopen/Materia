<header>
	<h1><?= $title ?></h1>
	<div id="logo"></div>
</header>

<section id="error-container">
	<p>This Materia assignment hasn't been setup correctly in <?= $system ?>.</p>
	<p>Your instructor will need to complete the setup process.</p>

	<?= Theme::instance()->view('partials/help/support_info') ?>
</section>