<header>
	<h1><?= $title ?></h1>
	<div id="logo"></div>
</header>

<section id="error-container">
	<p>This assignment has guest mode enabled.</p>
	<p>This assignment can only record scores anonymously and therefore cannot be played as an embedded assignment.</p>
	<p>Your instructor will need to disable guest mode or provide a link to play as a guest.</p>

	<?= Theme::instance()->view('partials/help/support_info') ?>
</section>
