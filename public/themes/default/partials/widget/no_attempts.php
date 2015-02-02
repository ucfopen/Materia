<div class="container <?= $classes ?>">
	<section class="attempts page">
		<?= $summary ?>

		<div class="detail">
			<h2 class="attempts-text">No remaining attempts</h2>
			<span class="attempts-subtext">You've used all <?= $attempts ?> available attempts.</span>
			<p>
				<a href="<?= $scores_path ?>">Review previous scores</a>
			</p>
		</div>
	</section>
</div>
