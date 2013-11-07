<header class="<?= empty($me) ? '' : 'logged_in' ?>">
	<h1 class="logo"><a href="/">Materia</a></h1>

	<? if (empty($me)) : ?>
		<p class="user">Not logged in. <?= Html::anchor(Router::get('login'), 'Login with your '.__('login.user')) ?></p>
	<? else : ?>
		<p class="user avatar">
			<img src="<?= \Materia\Utils::get_avatar(); ?>" />
			Welcome <a href="/profile"><?= "$me->first $me->last" ?></a>
		</p>
	<? endif; ?>

	<nav>
		<ul>
			<li><?= Html::anchor('/widgets', 'Widget Catalog') ?></li>
			<li><?= Html::anchor('/my-widgets', 'My Widgets') ?></li>
			<li><?= Html::anchor('/help', 'Help') ?></li>

			<? if (empty($me)) : ?>
				<li class="logout"><?= Html::anchor(Router::get('login'), 'Login with your '.__('login.user')) ?></a></li>
			<? /*elseif (isset($page_type) && $page_type != 'login')*/ else : ?>
				<li class="logout"><?= Html::anchor('/users/logout', 'Logout') ?></li>
			<? endif; ?>

		</ul>
	</nav>

	<? if ( ! empty($me)) : ?>
		<a id="notifications_link" data-notifications="0"></a>
		<div id="notices"></div>
	<? endif; ?>

</header>