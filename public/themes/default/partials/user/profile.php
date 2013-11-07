<div class="container">
	<section class="page">

	<ul class="main_navigation">
		<li class="selected profile"><a href="/profile">Profile</a></li>
		<li class="settings"><a href="/settings">Settings</a></li>
	</ul>

	<div class="avatar_big">
		<img src="<?= \Materia\Utils::get_avatar(100) ?>" />
	</div>

	<h2><span>Profile</span>
	<?= $me->first.' '.$me->last ?>
	</h2>

	<ul class="user_information">
		<? if (\RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR])) : ?>
			<li class="user_type staff">staff</li>
		<? else : ?>
			<li class="user_type">student</li>
		<? endif; ?>
	</ul>

	<h3>Activity</h3>

	<div class="activity">

		<ul class="activity_list">
			<li class="activity_log activity_logs_template" id="activity_logs_template">
				<a class="score-link" href="">
					<div class="status"></div>
					<div class="widget"></div>
					<div class="title"></div>
					<div class="date"></div>
					<div class="score"></div>
				</a>
			</li>
		</ul>

	</div>

	<a href="#" class="show_more_activity" id="show_more_activity"><span class="message_loading" id="activity_logs_loading">Loading...</span> Show more</a>

	<p class="no_logs">You don't have any activity! Start doing stuff.</p>

</section>
</div>