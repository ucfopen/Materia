<div ng-controller='adminUserController'>
	<div class='container'>
		<section class='page user-info' ng-show='selectedUser'>
			<div class='error-holder' ng-show='error_message.length > 0'>
				<div ng-repeat='error in error_message'>
					{{ error }}
				</div>
			</div>
			<div>
				<span class='clickable back' ng-click='deselectUser()'>
					Return
				</span>
			</div>
			<div class='top info-holder'>
				<span>
					<img ng-src="{{selectedUser.gravatar}}">
				</span>
				<span>
					<h1>{{ selectedUser.first }} {{ selectedUser.last }}</h1>
				</span>
			</div>
			<div class='info-holder'>
				<div>
					<span>
						<label>Created:</label>{{ selectedUser.created_at*1000 | date:'short' }}
					</span>
				</div>
				<div>
					<span>
						<label>Last Login:</label>{{ selectedUser.last_login*1000 | date:'short' }}
					</span>
				</div>
				<div>
					<span>
						<label>Username:</label>{{ selectedUser.username }}
					</span>
				</div>
				<div>
					<span>
						<label>E-mail:</label><input type='text' ng-model='selectedUser.email' />
					</span>
				</div>
				<div>
					<span>
						<label>Student:</label><input type='checkbox' ng-model='selectedUser.is_student'/>
					</span>
					<span>
						Note: Saving changes with this box unchecked indicates that this user is a teacher.
					</span>
				</div>
				<div>
					<span>
						<label>Notifications:</label><input type='checkbox' ng-model='selectedUser.profile_fields.notify'/>
					</span>
				</div>
				<div>
					<span>
						<label>Gravatar:</label><input type='checkbox' ng-model='selectedUser.profile_fields.useGravatar'/>
					</span>
				</div>
				<div>
					<button ng-click='save()'>Save Changes</button>
				</div>
				<hr/>
				<div class='instances'>
					<div class='top'>
						<h1>Instances Available:</h1>
					</div>
					<ul>
						<li class='widget-info' ng-repeat='instance in additionalData.instances_available'>
							<div class='clickable widget-title' ng-click='instance.expanded = !instance.expanded'>
								<h1 ng-class='{created_by: instance.user_id == selectedUser.id}'>
									{{ instance.name }}
								</h1>
							</div>
							<div class='info-holder' ng-show='instance.expanded'>
								<div>
									<span>
										<label>ID:</label>{{ instance.id }}
									</span>
								</div>
								<div>
									<span>
										<label>Created:</label>{{ instance.created_at*1000 | date:'short' }}
									</span>
								</div>
								<div>
									<span>
										<label>Draft:</label>{{ instance.is_draft ? 'Yes' : 'No' }}
									</span>
								</div>
								<div>
									<span>
										<label>Student-Made:</label>{{ instance.is_student_made ? 'Yes' : 'No' }}
									</span>
								</div>
								<div>
									<span>
										<label>Guest Access:</label>{{ instance.guest_access ? 'Yes' : 'No' }}
									</span>
								</div>
								<div>
									<span>
										<label>Student Access:</label>{{ instance.student_access ? 'Yes' : 'No' }}
									</span>
								</div>
								<div>
									<span>
										<label>Embedded Only:</label>{{ instance.embedded_only ? 'Yes' : 'No' }}
									</span>
								</div>
								<div>
									<span>
										<label>Embedded:</label>{{ instance.is_embedded ? 'Yes' : 'No' }}
									</span>
								</div>
								<div>
									<span>
										<label>Open Time:</label>{{ instance.open_at < 0 ? 'Forever' : (instance.open_at*1000) | date: 'short' }}
									</span>
								</div>
								<div>
									<span>
										<label>Close Time:</label>{{ instance.close_at < 0 ? 'Never' : (instance.close_at*1000) | date: 'short' }}
									</span>
								</div>
								<div>
									<span>
										<label>Attempts Allowed:</label>{{ instance.attempts < 0 ? 'Unlimited' : instance.attempts }}
									</span>
								</div>
								<div>
									<span>
										<label><a target='_blank' href="{{ instance.play_url }}">Play URL:</a></label>{{ instance.play_url }}
									</span>
								</div>
								<div>
									<span>
										<label><a target='_blank' href="{{ instance.preview_url }}">Preview URL:</a></label>{{ instance.preview_url }}
									</span>
								</div>
								<div>
									<span>
										<label><a target='_blank' href="{{ instance.embed_url }}">Embed URL:</a></label>{{ instance.embed_url }}
									</span>
								</div>
							</div>
						</li>
					</ul>
				</div>
				<div>
					<div class='top'>
						<h1>Instances Played:</h1>
					</div>
					<ul>
						<li ng-repeat='instance in additionalData.instances_played'>
							<div class='clickable widget-title' ng-click='instance.expanded = !instance.expanded'>
								<h1>
									{{ instance.name }} ({{ instance.id }})
								</h1>
							</div>
							<div class='info-holder' ng-show='instance.expanded'>
								<ul>
									<li ng-repeat='play in instance.plays'>
										<div>
											<span>
												Date: {{ play.created_at*1000 | date: 'short' }}
											</span>
											<span>
												Score: <strong>{{ play.percent }}%</strong>
											</span>
										</div>
									</li>
								</ul>
							</div>
						</li>
					</ul>
				</div>
			</div>
		</section>
		<section class='page' ng-hide='selectedUser'>
			<div class='top'>
				<h1>Look Up and Modify Users</h1>
			</div>
			<span class="input_label">Search users:</span>
			<input
				tabindex="0"
				ng-model="inputs.userSearchInput"
				ng-model-options="{ updateOn: 'default', debounce: {'default': 400, 'blur': 0} }"
				class="user_add"
				type="text"
				placeholder="Enter a Materia user's name or e-mail"/>
			<div class="search_list" ng-show="searchResults.show">
				<div
					ng-repeat="match in searchResults.matches"
					ng-mouseup="searchMatchClick(match)"
					class="search_match clickable"
					ng-class="{ focused: selectedMatch == match }">
					<div class="img-holder">
						<img ng-src="{{match.gravatar}}">
					</div>
					<div class="info-holder">
						{{match.first}} {{match.last}}
					</div>
				</div>

				<div ng-if="searchResults.none && !searchResults.searching" class="no_match_message">
					<b>No matches found.</b>
					<p>The person you're searching for may need to log in to create an account.</p>
				</div>
				<div ng-if="searchResults.searching" class="no_match_message">
					<b>Searching Users...</b>
				</div>
			</div>
		</section>
	</div>
</div>