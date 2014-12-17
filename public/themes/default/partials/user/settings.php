<div class="container" ng-controller="settingsController">
	<section class="page">

		<ul class="main_navigation">
			<li class="selected profile"><a href="/profile">Profile</a></li>
			<li class="settings"><a href="/settings">Settings</a></li>
		</ul>

		<div class="avatar_big">
			<img ng-src="{{avatar}}" />
		</div>

		<h2><span>Account</span>Settings</h2>

		<form name="settingsForm" ng-submit="saveSettings()" novalidate>

			<h3>Notifications</h3>

			<ul>
				<li>
					<input type="checkbox" id="notify" name="notify" ng-model="user.notify" />
					<label for="notify">Send me an email when a widget has been shared with me.</label>
					<br/>
					<p class="email_exp">Email notifications will be sent to <span class="email_exp_addr"><?= $me->email ?></span>.</p>
				</li>
			</ul>

			<h3>User Icon</h3>
			<ul>
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

			<span ng-if="showBeardMode == true">
				<h3>Extras</h3>
				<input type="checkbox" id="activate_beard_mode" name="activate_beard_mode" ng-model="user.beardMode" required/>
				<label for="activate_beard_mode">Activate Beard Mode</label>
			</span>

			<p>
				<button type="submit" class="action_button" ng-disabled="!settingsForm.$dirty">Save</button>
			</p>

		</form>

	</section>
</div>
