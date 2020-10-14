<div class="container <?= $classes ?>" ng-controller="UserLoginCtrl">
	<section class="page">
		<?= $summary ?>
		<div class="detail">
			<h2 class="logo">Widget Unavailable</h2>
			<div class="availability_message"><?= $availability ?></div>
			<?= isset($date) ? "<span class=\"server_date\" ng-init=\"date='$date'\"></span>" : '' ?>
		</div>
	</section>
</div>
