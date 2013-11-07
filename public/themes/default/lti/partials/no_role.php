<header>
	<h1><?= $title ?></h1>
	<div id="logo"></div>
</header>

<section id="error-container">
	<p>Materia can not determine your role in <?= $system ?>.</p>
	<p>This may occur if you are using a non-standard account or if you don't have permissions to this object.</p>

	<p>If you need help accessing this tool, contact support.</p>

	<?= Theme::instance()->view('partials/help/support_info') ?>
</section>