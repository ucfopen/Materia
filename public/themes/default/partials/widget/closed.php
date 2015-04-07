<div class="container login <?= $classes ?>" ng-controller="loginCtrl">
	<section class="page">
		<?= $summary ?>
		<div class="detail widget-mode">
			<h2 class="logo">Widget Unavailable</h2>
			<div class="availability-message"><?= $availability ?></div>
			<?= isset($date) ? "<span class=\"server_date\" ng-init=\"date='$date'\"></span>" : '' ?>
		</div>
	</section>
</div>
