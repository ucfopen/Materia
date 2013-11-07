<div class="container">
	<section class="page">

	<ul class="main_navigation">
		<li class="profile"><a href="/profile">Profile</a></li>
		<li class="selected settings"><a href="/settings">Settings</a></li>
	</ul>

	<div class="avatar avatar_big">
		<img src="<?= \Materia\Utils::get_avatar(100) ?>" />
	</div>

	<h2><span>Account</span>Settings</h2>

	<form method="post">

		<h3>Notifications</h3>

		<ul>
			<li>
				<input type="checkbox" id="notify_on_perm_change" name="notify_on_perm_change" <? if ($me->profile_fields['notify_on_perm_change'] == 'on') { echo 'checked = "checked"'; } ?> />
				<label for="notify_on_perm_change">Send me an email when a widget has been shared with me.</label>
				<br/>
				<p class="email_exp">Email notifications will be sent to <span class="email_exp_addr"><?= $me->email ?></span>.</p>
			</li>
		</ul>

		<h3>User Icon</h3>
		<ul>
			<li>
				<input type="radio" name="avatar" id="avatar_gravatar" value="gravatar" <? if ( ! isset($me->profile_fields['avatar']) || $me->profile_fields['avatar'] == 'gravatar') { echo 'checked="checked"'; } ?> />
				<label for="avatar_gravatar">Use Gravatar</label>
				<a class="external tiny" href="https://en.gravatar.com/" target="_blank">(Upload or change your icon at gravatar.com)</a>
			</li>
			<li>
				<input type="radio" name="avatar" id="avatar_default" value="default" <? if ( $me->profile_fields['avatar'] == 'default') { echo 'checked="checked"'; } ?> />
				<label for="avatar_default">None</label>
			</li>
		</ul>

		<? if (\Input::get('show_beard_mode', false) == 'true' || $me->profile_fields['beardmode'] == 'on'): ?>
			<h3>Extras</h3>

			<input type="checkbox" id="activate_beard_mode" name="activate_beard_mode" <? if ($me->profile_fields['beardmode'] == 'on') { echo 'checked="checked"'; } ?> />
			<label for="activate_beard_mode">Activate Beard Mode</label>
		<? endif; ?>

		<p>
			<input type="submit" class="disabled action_button" value="Save" />
		</p>

	</form>

</section>
</div>