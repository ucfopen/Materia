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
		<div ng-controller="notificationCtrl">
			<a id="notifications_link" ng-show="notifications.length > 0" data-notifications="{{notifications.length}}" ng-click="clickNotification()"></a>
			<div id="notices">
				<div class="notice" ng-repeat="notification in notifications">
					<a href="#" class="noticeClose" ng-click="removeNotification($index)"></a>
					<p class="icon"><img class="senderAvatar" src="{{notification.avatar}}"></img></p>
					<div class="notice_right_side">
						<p class="subject" ng-bind-html="trust(notification.subject)"></p>
					</div>
				</div>
			</div>
		</div>
	<? endif; ?>

</header>
