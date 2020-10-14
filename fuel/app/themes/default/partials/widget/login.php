<div class="container <?= $classes ?>" ng-controller="UserLoginCtrl">
	<section class="page">
		<?= isset($date) ? "<span class=\"server_date\" ng-init=\"date='$date'\"></span>" : '' ?>
		<?= $summary ?>

		<div class="detail">
			<h2 class="logo">
				<?= $title ?>
			</h2>
			<span class="subtitle">Using your <?= __('login.user') ?> and <?= __('login.password') ?></span>
		</div>

		<div id="form">
			<?php if ($msg = Session::get_flash('login_error')): /* Incorrect Login Error */ ?>
				<div class="error">
					<p><?= $msg ?></p>
				</div>
			<?php endif ?>
			<?php if ($notice = (array) Session::get_flash('notice')): /* Not logged in error */ ?>
				<div class="error">
					<p><?= implode('</p><p>', $notice) ?> </p>
				</div>
			<?php endif ?>
			<form method="post" action="<?= Router::get('login') ?>?redirect=<?= urlencode(URI::current()) ?>" class="form-content" >
				<ul>
					<li>
						<input type="text" name="username" id="username" value="" placeholder="<?= __('login.user') ?>" tabindex="1" />
					</li>
					<li>
						<input type="password" name="password" id="password" value="" placeholder="<?= __('login.password') ?>" tabindex="2" />
					</li>
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
