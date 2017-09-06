<?php // @codingStandardsIgnoreStart ?>
<header ng-controller="currentUserCtrl" class="{loggedIn: currentUser.loggedIn==true}" >
	<?php /* @TODO: this should maybe be retrieved via the api instead of mucking with the html here */
		$allow_logins = ! \Config::get('auth.restrict_logins_to_lti_single_sign_on', false);
	?>
	<?php if ($me->is_guest()): ?>
		<span id="current-user" data-logged-in="false"></span>
	<?php else: ?>
		<span id="current-user"
			data-logged-in="true"
			data-name="<?= "{$me->first} {$me->last}" ?>"
			data-avatar="<?= \Materia\Utils::get_avatar() ?>"
			data-role="<?= \RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR]) ? 'Staff' : 'Student' ?>"
			data-notify="<?= $me->profile_fields['notify'] ? 'true' : 'false' ?>"
		></span>
	<?php endif ?>

	<h1 class="logo"><a href="/">Materia</a></h1>

	<span ng-switch="currentUser.loggedIn">
		<p ng-switch-when="true" class="user avatar">
			<img ng-src="{{currentUser.avatar}}" />
			Welcome <a href="/profile">{{currentUser.name}}</a>
		</p>
		<p ng-switch-when="false" class="user">
			Not logged in.
			<?php if ($allow_logins): ?>
			<a href="/users/login">Login with your <?= __('login.user') ?></a>
			<?php endif; ?>
		</p>
	</span>
	<nav>
		<ul>
			<li><a href="/widgets" >Widget Catalog</a></li>
			<li><a href="/my-widgets">My Widgets</a></li>
			<li><a href="/help">Help</a></li>

			<?php if ( !$me->is_guest() && \RocketDuck\Perm_Manager::is_super_user()): ?>
				<li class="nav_expandable">
					<span class='elevated'>Admin</span>
					<ul>
						<li>
							<a class='elevated' href="/admin/widget">Widgets</a>
						</li>
						<li>
							<a class='elevated' href="/admin/user">Users</a>
						</li>
					</ul>
				</li>
			<?php endif; ?>

			<li ng-switch="currentUser.loggedIn" class="logout">
				<a ng-switch-when="true" href="/users/logout">Logout</a>
				<?php if ($allow_logins): ?>
				<a ng-switch-when="false" href="/users/login">Login with your <?= __('login.user') ?></a>
				<?php endif; ?>
			</li>
		</ul>
	</nav>

	<div ng-if="currentUser.loggedIn" ng-controller="notificationCtrl" ng-show="values.notifications.length > 0">
		<a id="notifications_link" data-notifications="{{values.notifications.length}}" ng-click="clickNotification()"></a>
		<div id="notices" ng-if="values.notifications.length > 0">
			<div class="notice" ng-repeat="notification in values.notifications">
				<p class="icon"><img class="senderAvatar" ng-src="{{notification.avatar}}"></p>
				<div class="notice_right_side">
					<p class="subject" ng-bind-html="trust(notification.subject)"></p>
				</div>
				<span class="noticeClose" ng-click="removeNotification($index)"></span>
			</div>
		</div>
	</div>
</header>
<?php // @codingStandardsIgnoreEnd ?>