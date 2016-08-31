<header>
	<h1><?= $title ?></h1>
	<div id="logo"></div>
</header>

<section id="error-container">
	<p>This Materia assignment hasn't been setup correctly in <?= $system ?>.</p>
	<p>Your instructor will need to complete the setup process.</p>

	<p>If you're the instructor review the <a target="_blank" rel="noopener noreferrer" href="http://online.ucf.edu/support/materia/using-materia-in-webcoursesucf/">Using Materia in Webcourses@UCF</a> guide for assistance.</p>

	<?= Theme::instance()->view('partials/help/support_info') ?>
</section>