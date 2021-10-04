<?php // @codingStandardsIgnoreStart ?>
<header ng-controller="UserCurrentCtrl" class="{loggedIn: currentUser.loggedIn==true}" >
	<?php
		$allow_logins = ! \Config::get('auth.restrict_logins_to_lti_single_sign_on', false);
	?>
	<?php if ($me->is_guest()): ?>
		<span id="current-user" data-logged-in="false"></span>
	<?php else: ?>
		<span id="current-user"
			data-logged-in="true"
			data-name="<?= "{$me->first} {$me->last}" ?>"
			data-avatar="<?= \Materia\Utils::get_avatar() ?>"
			data-role="<?= \Materia\Perm_Manager::does_user_have_role([\Materia\Perm_Role::AUTHOR]) ? 'Staff' : 'Student' ?>"
			data-notify="<?= $me->profile_fields['notify'] ? 'true' : 'false' ?>"
		></span>
	<?php endif ?>

	<h1 class="logo"><a href="/">Materia</a></h1>

	<span ng-switch="currentUser.loggedIn">
		<p class="user avatar">
			<a ng-switch-when="true" href="/profile">
				<span>{{currentUser.name}}</span>
				<img ng-src="{{currentUser.avatar}}" />
			</a>

			<span ng-switch-when="true" class="logout">
				<a href="/users/logout">Logout</a>
			</span>

			<?php if ($allow_logins): ?>
			<a ng-switch-when="false" href="/users/login">Login</a>
			<?php endif; ?>
		</p>
	</span>
	<button id="mobile-menu-toggle" ng-class="{expanded: menuExpanded}" ng-click="menuExpanded = !menuExpanded">
		<div></div>
	</button>
	<nav>
		<ul>
			<li><a href="/widgets" >Widget Catalog</a></li>
			<li><a href="/my-widgets">My Widgets</a></li>
			<li><a ng-if="currentUser.loggedIn" href="/profile">My Profile</a></li>
			<li><a href="/help">Help</a></li>

			<?php if ( !$me->is_guest() && \Materia\Perm_Manager::is_super_user()): ?>
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

			<li ng-if="currentUser.loggedIn">
				<span class="logout">
					<a href="/users/logout">Logout</a>
				</span>
			</li>
		</ul>
	</nav>

	<div ng-if="currentUser.loggedIn" ng-controller="UserNotificationCtrl" ng-show="notifications.length > 0">
		<a id="notifications_link" data-notifications="{{notifications.length}}" ng-click="toggleOpen()"></a>
		<div id="notices" ng-class="{open: isOpen}">
			<div ng-repeat="notification in notifications" ng-class="{notice: true, deleted: notification.deleted}">
				<p class="icon"><img class="senderAvatar" ng-src="{{notification.avatar}}"></p>
				<div class="notice_right_side">
					<p class="subject" ng-bind-html="trust(notification.subject)"></p>
					<button class="action_button notification_action" ng-if="notification.action" ng-click="notification.button_action_callback()">{{notification.button_action_text}}</button>
				</div>
				<span class="noticeClose" ng-click="removeNotification($index, notification.id)"></span>
			</div>
		</div>
	</div>
</header>
<?php // @codingStandardsIgnoreEnd ?>
