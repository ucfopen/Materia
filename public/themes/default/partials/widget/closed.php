<div class="container <?= $classes ?>">
	<section class="page">
		<?= $summary ?>
		<div class="detail">
			<h2 class="logo">Widget Unavailable</h2>
			<div class="availability_message"><?= $availability ?></div>
			<?= isset($date) ? "<span class=\"server_date\">$date</span>" : '' ?>
		</div>
	</section>
</div>