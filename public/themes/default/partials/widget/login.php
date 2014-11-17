<div class="container <?= $classes ?>" ng-controller="loginCtrl">
	<section class="page">
		<?= $summary ?>

		<hgroup class="detail">
			<h2 class="logo">
				<?= $title ?>
				<?= isset($date) ? "<span class=\"server_date\">$date</span>" : '' ?>
			</h2>
			<h3>Using your <?= __('login.user') ?> and <?= __('login.password') ?></h3>
		</hgroup>

		<div id="form">
			<? if ($msg = Session::get_flash('login_error')): /* Incorrect Login Error */ ?>
				<div class="error">
					<p><?= $msg ?></p>
				</div>
			<? endif ?>
			<? if ($notice = (array) Session::get_flash('notice')): /* Not logged in error */ ?>
				<div class="error">
					<p><?= implode('</p><p>', $notice) ?> </p>
				</div>
			<? endif ?>
			<form method="post" action="<?= Router::get('login') ?>?redirect=<?= urlencode(URI::current()) ?>" class="form-content" >
				<ul>
					<li>
						<label for="username" id="username_label" style="opacity: {{ username_opacity }}"><?= __('login.user') ?></label>
						<input type="text" ng-change="checkInput()" ng-model="username" name="username" id="username" value="" title="<?= __('login.user') ?>" tabindex="1" />
					</li>
					<li>
						<label for="password" id="password_label" style="opacity: {{ password_opacity }}"><?= __('login.password') ?></label>
						<input type="password" ng-change="checkInput()" ng-model="password" name="password" id="password" value="" title="<?= __('login.password') ?>" tabindex="2" />
					</li>
					<li class="submit_button">
						<input type="submit" value="Login" tabindex="3" class="action_button" />
					</li>
				</ul>
				<ul class="help_links">
					<? foreach (__('login.links') as $a) echo '<li>'.Html::anchor($a['href'], $a['title']).'</li>'; ?>
					<li><a href="/help">Help</a></li>
				</ul>
			</form>
		</div>

	</section>
</div>
