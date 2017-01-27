<div ng-controller='adminUserController'>
	<div class='container'>
		<section class='long page user-info' ng-show='selectedUser'>
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
					<span class='long'>
						<label>E-mail:</label><input type='text' ng-model='selectedUser.email' />
					</span>
				</div>
				<div>
					<span>
						<label>Student:</label><input type='checkbox' ng-model='selectedUser.is_student'/>
					</span>
					<span>
						Note: Saving changes with this box unchecked will set this user as a teacher.
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
				<div>
				</div>
			</div>
		</section>
		<section class='long page' ng-hide='selectedUser'>
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