<div class="container <?= $classes ?>">
	<h1><?= $name ?></h1>
	<section class="page small">
		<div class="widget_info">
			<div class="widget_icon">
				<img src="<?= $icon ?>" alt="">
			</div>
		</div>
		<hgroup class="detail">
			<h2 class="logo">
				<?= $title ?>
				<?= isset($date) ? "<span class=\"server_date\">$date</span>" : '' ?>
			</h2>
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
				<input type="submit" value="Login with UCF" tabindex="3" class="action_button" />
				<ul class="help_links footer">
					<? foreach (__('login.links') as $a) echo '<li>'.Html::anchor($a['href'], $a['title']).'</li>'; ?>
					<li><a href="/help">Help</a></li>
				</ul>
			</form>
		</div>
	</section>
</div>
