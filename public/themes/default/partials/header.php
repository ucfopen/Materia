<header ng-controller="currentUserCtrl" class="{loggedIn: currentUser.loggedIn==true}" >

	<? /* @TODO: this should maybe be retrieved via the api instead of mucking with the html here */ ?>
	<? if (empty($me)): ?>
		<span id="current-user" data-logged-in="false"></span>
	<? else: ?>
		<span id="current-user"
			data-logged-in="true"
			data-name="<?= "{$me->first} {$me->last}" ?>"
			data-avatar="<?= \Materia\Utils::get_avatar() ?>"
			data-role="<?= \RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR]) ? 'Staff' : 'Student' ?>"
			data-notify="<?= $me->profile_fields['notify'] ? 'true' : 'false' ?>"
		></span>
	<? endif ?>

	<h1 class="logo"><a href="/">Materia</a></h1>

	<span ng-switch="currentUser.loggedIn">
		<p ng-switch-when="true" class="user avatar">
			<img ng-src="{{currentUser.avatar}}" />
			Welcome <a href="/profile">{{currentUser.name}}</a>
		</p>
		<p ng-switch-when="false" class="user">
			Not logged in. <a href="/users/login">Login with your <?= __('login.user') ?></a>
		</p>
	</span>
	<nav>
		<ul>
			<li><a href="/widgets" >Widget Catalog</a></li>
			<li><a href="/my-widgets">My Widgets</a></li>
			<li><a href="/help">Help</a></li>

			<li ng-switch="currentUser.loggedIn" class="logout">
				<a ng-switch-when="true" href="/users/logout">Logout</a>
				<a ng-switch-when="false" href="/users/login">Login with your <?= __('login.user') ?></a>
			</li>
		</ul>
	</nav>

	<div ng-if="currentUser.loggedIn" ng-controller="notificationCtrl" ng-show="values.notifications.length > 0">
		<a id="notifications_link" data-notifications="{{values.notifications.length}}" ng-click="clickNotification()"></a>
		<div id="notices" ng-if="values.notifications.length > 0">
			<div class="notice" ng-repeat="notification in values.notifications">
				<a href="#" class="noticeClose" ng-click="removeNotification($index)"></a>
				<p class="icon"><img class="senderAvatar" ng-src="{{notification.avatar}}"></p>
				<div class="notice_right_side">
					<p class="subject" ng-bind-html="trust(notification.subject)"></p>
				</div>
			</div>
		</div>
	</div>

</header>
