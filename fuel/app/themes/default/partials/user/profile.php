<div ng-controller="UserProfileCtrl" class="container">
	<section class="page">

		<ul class="main_navigation">
			<li class="selected profile"><a href="/profile">Profile</a></li>
			<li class="settings"><a href="/settings">Settings</a></li>
		</ul>

		<div class="avatar_big">
			<img ng-src="{{avatar}}" />
		</div>

		<h2><span>Profile</span>
		{{user.name}}
		</h2>

		<ul class="user_information">
			<li class="user_type" ng-class="user.role == 'Staff' ? 'staff' : ''">{{user.role}}</li>
		</ul>

		<h3 ng-class="loading ? 'loading' : ''">Activity</h3>

		<div class="activity">

			<ul class="activity_list">
				<li class="activity_log" ng-repeat="activity in activities" ng-class="{perfect_score: activity.percent == 100, complete: activity.is_complete == 1, incomplete: activity.is_complete != 1}">
					<a class="score-link" ng-href="{{getLink(activity)}}">
						<div class="status">{{getStatus(activity)}}</div>
						<div class="widget">{{activity.widget_name}}</div>
						<div class="title">{{activity.inst_name}}</div>
						<div class="date">{{getDate(activity)}}</div>
						<div class="score">{{getScore(activity)}}</div>
					</a>
				</li>
			</ul>

		</div>

		<a class="show_more_activity" ng-show="more" ng-click="getLogs()"><span class="message_loading" ng-show="loading">Loading...</span> Show more</a>

		<p class="no_logs" ng-show="activities && activities.length == 0">You don't have any activity! Start doing stuff.</p>

	</section>
</div>
