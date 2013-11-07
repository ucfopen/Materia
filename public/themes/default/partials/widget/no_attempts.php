<div class="container <?= $classes ?>">
	<section class="attempts page">
		<?= $summary ?>

		<hgroup class="detail">
			<h2 class="attempts-text">No remaining attempts</h2>
			<h3 class="attempts-subtext">You've used all <?= $attempts ?> available attempts.</h3>
			<a href="<?= $scores_path ?>">Review previous scores</a>
		</hgroup>
	</section>
</div>