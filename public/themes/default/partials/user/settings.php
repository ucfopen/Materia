<main id="settings-page" role="main">
	<div class="content-container" ng-controller="settingsController">
		<section class="content">
			<nav class="profile-nav">
				<img class="avatar" ng-src="{{avatar}}">

				<ul>
					<li class="profile"><a href="/profile">Profile <span class="fa fa-user"></span></a></li>
					<li class="selected settings"><a href="/settings">Settings <span class="fa fa-cog"></span></a></a></li>
				</ul>
			</nav>

			<div class="profile-content">
				<h2><span>Account</span>Settings</h2>

				<form name="settingsForm" ng-submit="saveSettings()" novalidate>

					<h3>Notifications</h3>

					<ul>
						<li>
							<input type="checkbox" id="notify" name="notify" ng-model="user.notify" />
							<label for="notify">Send me an email when a widget has been shared with me.</label>
							<br/>
							<p class="email-exp">Email notifications will be sent to <span class="email-exp-addr"><?= $me->email ?></span>.</p>
						</li>
					</ul>

					<h3>User Icon</h3>
					<ul>
						<li>
							<input type="radio" name="avatar" id="avatar-gravatar" ng-value="true" ng-model="useGravatar" required/>
							<label for="avatar-gravatar">Use Gravatar</label>
							<a class="external tiny" href="https://en.gravatar.com/" target="_blank">(Upload or change your icon at gravatar.com)</a>
						</li>
						<li>
							<input type="radio" name="avatar" id="avatar-default" ng-value="false" ng-model="useGravatar" required/>
							<label for="avatar-default">None</label>
						</li>
					</ul>

					<hr>

					<button type="submit" class="action-button orange" ng-disabled="!settingsForm.$dirty" role="button">Save</button>
				</form>
			</div>
		</section>
	</div>
</main>
