<div class="container" ng-controller="UserSettingsController">
	<section class="page">

		<ul class="main_navigation">
			<li class="profile"><a href="/profile">Profile</a></li>
			<li class="selected ettings"><a href="/settings">Settings</a></li>
		</ul>

		<div class="avatar_big">
			<img ng-src="{{avatar}}" />
		</div>

		<div>
			<div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between"}}>
				<span>Settings</span>
			</div>
			<h2>Temp Name</h2>
			<!-- <h2>
				{{first} {{last}}
			</h2> -->
		</div>

		<form name="settingsForm" ng-submit="saveSettings()" novalidate>

			<span class="settings_subheader">Notifications</span>

			<ul class="settings_subtext">
				<li>
					<input type="checkbox" id="notify" name="notify" ng-model="user.notify" />
					<label for="notify">Send me an email when a widget has been shared with me.</label>
					<br/>
					<div class="email_exp">Email notifications will be sent to <p class="email_exp_addr"><?= $me->email ?></p>.</div>
				</li>
			</ul>

			<span class="settings_subheader">User Icon</span>
			<ul class="settings_subtext">
				<li>
					<input type="radio" name="avatar" id="avatar_gravatar" ng-value="true" ng-model="useGravatar" required/>
					<label for="avatar_gravatar">Use Gravatar</label>
					<a class="external tiny" href="https://en.gravatar.com/" target="_blank">(Upload or change your icon at gravatar.com)</a>
				</li>
				<li>
					<input type="radio" name="avatar" id="avatar_default" ng-value="false" ng-model="useGravatar" required/>
					<label for="avatar_default">None</label>
				</li>
			</ul>

			<div ng-if="beardMode === 'true'">
				<h3>Beard Mode</h3>
				<button
					class="action_button no_top_margin"
					ng-click="disableBeardMode()">Disable Beard Mode</button>
			</div>

			<ul class="settings_subtext">
				<li class="submit_button">
					<button type="submit" class="action_button" ng-disabled="!settingsForm.$dirty">Save</button>
				</li>
			</ul>

		</form>

	</section>
</div>
