<header>
	<h1><?= $title ?></h1>
	<div id="logo"></div>
</header>

<section id="error-container">
	<p>Materia can not determine who you are using the information provided by <?= $system ?>.</p>
	<p>This may occur if you are using a non-standard account or if your information is missing from Materia due to recent changes to your account.</p>

	<p>If you need help accessing this tool, contact support.</p>

	<?= Theme::instance()->view('partials/help/support_info') ?>
</section>