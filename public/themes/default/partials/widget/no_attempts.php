<div class="container <?= $classes ?>">
	<section class="attempts page">
		<?= $summary ?>

		<div class="detail icon-offset">
			<h2 class="unavailable-text">No remaining attempts</h2>
			<span class="unavailable-subtext">You've used all <?= $attempts ?> available attempts.</span>
			<p>
				<a href="<?= $scores_path ?>">Review previous scores</a>
			</p>
		</div>
	</section>
</div>
