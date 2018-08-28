<header>
	<h1><?= $title ?></h1>
	<div id="logo"></div>
</header>

<section id="error-container">
	<p>This Materia assignment hasn't been setup correctly in <?= $system ?>.</p>
	<p>Non-autoplaying widgets can not be used as graded assignments.</p>

	<?= Theme::instance()->view('partials/help/support_info') ?>
</section>