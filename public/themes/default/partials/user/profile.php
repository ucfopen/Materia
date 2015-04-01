<main id="profile-page" role="main" ng-controller="profileCtrl">
	<div class="content-container">
		<section class="content">
			<nav class="profile-nav">
				<img class="avatar" ng-src="{{avatar}}">

				<ul>
					<li class="selected profile"><a href="/profile">Profile <span class="fa fa-user"></span></a></li>
					<li class="settings"><a href="/settings">Settings <span class="fa fa-cog"></span></a></li>
				</ul>
			</nav>

			<div class="profile-content">
				<h2><span>Profile</span>
				{{user.name}}
				</h2>

				<ul class="user-information">
					<li class="user-type" ng-class="user.role == 'Staff' ? 'staff' : ''">{{user.role}}</li>
				</ul>

				<h3 ng-class="loading ? 'loading' : ''">Activity</h3>

				<div class="activity">
					<ul class="activity-list">
						<li class="activity-log" ng-repeat="activity in activities" ng-class="{perfect_score: activity.percent == 100, complete: activity.is_complete == 1, incomplete: activity.is_complete != 1}">
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

				<a class="show-more-activity action-button orange block" ng-show="more" ng-click="getLogs()"><span class="message-loading" ng-show="loading">Loading...</span> Show more</a>

				<p class="no-logs" ng-show="activities && activities.length == 0">You don't have any activity! Start doing stuff.</p>
			</div>
		</section>
	</div>
</main>
