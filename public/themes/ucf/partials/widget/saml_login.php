<div class="container <?= $classes ?>" ng-controller="loginCtrl">
	<section class="page">
		<?= isset($date) ? "<span class=\"server_date\" ng-init=\"date='$date'\"></span>" : '' ?>
		<?= $summary ?>

		<div class="detail">
			<h2 class="logo">
				<?= $title ?>
			</h2>
		</div>

		<div id="form">
			<form method="get" action="<?= Router::get('login') ?>?redirect=<?= urlencode(URI::current()) ?>" class="form-content" >
				<ul>
					<li class="submit_button">
						<button type="submit" tabindex="3" class="action_button">Login</button>
					</li>
				</ul>
				<ul class="help_links">
					<?php foreach (__('login.links') as $a) echo '<li>'.Html::anchor($a['href'], $a['title']).'</li>'; ?>
					<li><a href="/help">Help</a></li>
				</ul>
			</form>
		</div>
	</section>
</div>
