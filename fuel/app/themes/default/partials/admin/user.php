<div ng-controller="AdminUserController">
	<div class="container">
		<section class="page" ng-show="selectedUser == null">
			<div class="top">
				<h1>User Admin</h1>
			</div>
			<span class="input_label">Search:</span>
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
		<section class="page user-info" ng-show="selectedUser !== null">
			<div class="error-holder" ng-show="errorMessage.length > 0">
				<div ng-repeat="error in errorMessage">
					{{ error }}
				</div>
			</div>
			<div>
				<button class="action_button back" ng-click="deselectUser()">
					<span class="arrow"></span>
					<span class="goBackText">Return</span>
				</button>
			</div>
			<div class="top info-holder">
				<span>
					<img ng-src="{{selectedUser.gravatar}}">
				</span>
				<span>
					<h1>{{ selectedUser.first }} {{ selectedUser.last }}</h1>
				</span>
			</div>
			<div class="info-holder">
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
						<label>E-mail:</label><input type="text" ng-model="selectedUser.email" />
					</span>
				</div>
				<div>
					<span>
						<label>Role:</label>
						<select ng-model="selectedUser.is_student"/>
							<option ng-value={{true}}>Student</option>
							<option ng-value={{false}}>Teacher</option>
						</select>
					</span>
				</div>
				<div>
					<span>
						<label>Notifications:</label>
						<label class="normal">
							<input type="checkbox" ng-model="selectedUser.profile_fields.notify"/>
							Enabled
						</label>
					</span>
				</div>
				<div>
					<span>
						<label>User Icon:</label>
						<select ng-model="selectedUser.profile_fields.useGravatar">
							<option ng-value={{true}}>Gravatar</option>
							<option ng-value={{false}}>None</option>
						</select>
					</span>
				</div>
				<div>
					<button class="action_button" ng-click="save()">Save Changes</button>
				</div>
			</div>
			<div class="info-holder">
				<hr/>
				<div class="instances">
					<div class="top">
						<h1>Instances Available:</h1>
					</div>
					<ul>
						<li ng-repeat="instance in additionalData.instances_available">
							<div class="clickable widget-title" ng-click="instance.expanded = !instance.expanded">
								<span class="img-holder">
									<img ng-src="{{instance.icon}}">
								</span>
								<span>
									<div class="title" ng-class="{created_by: instance.user_id == selectedUser.id}">
										{{ instance.name }}
									</div>
									<div>
										{{ instance.widget.name }}
									</div>
								</span>
							</div>
							<div class="info-holder" ng-show="instance.expanded">
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
										<label>Play URL:</label><a target="_blank" href="{{ instance.play_url }}">{{ instance.play_url }}</a>
									</span>
								</div>
								<div>
									<span>
										<label>Preview URL:</label><a target="_blank" href="{{ instance.preview_url }}">{{ instance.preview_url }}</a>
									</span>
								</div>
								<div>
									<span>
										<label>Embed URL:</label><a target="_blank" href="{{ instance.embed_url }}">{{ instance.embed_url }}</a>
									</span>
								</div>
							</div>
						</li>
					</ul>
				</div>
				<div>
					<div class="top">
						<h1>Instances Played:</h1>
					</div>
					<ul>
						<li ng-repeat="instance in additionalData.instances_played">
							<div class="clickable widget-title" ng-click="instance.expanded = !instance.expanded">
								<span class="img-holder">
									<img ng-src="{{ instance.icon }}">
								</span>
								<span>
									<div class="title">
										{{ instance.name }} ({{ instance.id }})
									</div>
									<div>
										{{ instance.widget.name }}
									</div>
								</span>
							</div>

							<div class="info-holder" ng-show="instance.expanded">
								<ul>
									<li ng-repeat="play in instance.plays">
										<div>
											<label>Date:</label>{{ play.created_at*1000 | date: 'short' }}
										</div>
										<div>
											<label>Score:</label><!--gross hack to remove space between inline elements
											--><a target="_blank" href="{{ '/scores/'+play.id+'/#single-'+play.play_id }}">{{ play.percent }}%</a>
										</div>
										<div>
											<label>Time Elapsed:</label>{{ play.elapsed }}s
										</div>
										<div>
											<label>Completed:</label>{{ play.is_complete == "1" ? 'Yes' : 'No' }}
										</div>
										<hr ng-if="$index < instance.plays.length-1" />
									</li>
								</ul>
							</div>
						</li>
					</ul>
				</div>
			</div>
		</section>
	</div>
</div>
