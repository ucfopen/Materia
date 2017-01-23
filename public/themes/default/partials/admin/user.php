<div ng-controller='adminUserController'>
	<div class='container'>
		<section class='long page'>
			<div class='top'>
				<h1>Modify Users</h1>
			</div>
			<span class="input_label">Search users:</span>
			<input
				tabindex="0"
				ng-model="inputs.userSearchInput"
				ng-model-options="{ updateOn: 'default', debounce: {'default': 400, 'blur': 0} }"
				ng-enter="searchMatchClick(selectedMatch)"
				class="user_add"
				type="text"
				placeholder="Enter a Materia user's name or e-mail"
				ng-keydown="searchKeyDown($event)" />
			<div class="search_list" ng-show="searchResults.show">
				<div
					ng-repeat="match in searchResults.matches"
					ng-mouseup="searchMatchClick(match)"
					class="search_match"
					ng-class="{ focused: selectedMatch == match }">
					<img class="user_match_avatar" ng-src="{{::match.gravatar}}">
					<p class="user_match_name" ng-class="{user_match_student: match.is_student}">
						{{::match.first}} {{::match.last}}
					</p>
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