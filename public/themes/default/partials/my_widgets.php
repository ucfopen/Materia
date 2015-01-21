<div ng-controller="MyWidgetsController">
	<div class="qtip top nowidgets" ng-show="widgets.widgetList.length == 0">Click here to start making a new widget!</div>
	<div class="container">
		<div ng-controller="SelectedWidgetController">

			<modal-dialog class="edit-published-widget" show="show.editPublishedWarning" dialog-title="Warning About Editing Published Widgets:" width="600px" height="320px">
				<div class="container">
					<p>Editing a published widget may affect statistical analysis when comparing data collected prior to your edits.</p>
					<h3>Caution should be taken when:</h3>
					<ul>
						<li>Students have already completed your widget</li>
						<li>You make significant content changes</li>
						<li>Edits change the difficulty level</li>
						<li>Statistics will be used for research</li>
					</ul>

					<span class="center">
						<a class="cancel_button" href="javascript:;" ng-click="show.editPublishedWarning = false">Cancel</a>
						<a class="action_button green" ng-href="{{edit}}">Edit Published Widget</a>
					</span>
				</div>
			</modal-dialog>

			<modal-dialog class="share" show="show.collaborationModal" dialog-title="Collaboration:" width="620px" height="500px">
				<div ng-if="show.collaborationModal" ng-controller="CollaborationController">
					<div id="access" class="container">
						<div ng-if="shareable" class="list_tab_lock">
							<span class="input_label">Add people:</span><input tabindex="0" ng-model="inputs.userSearchInput" ng-model-options="{ updateOn: 'default', debounce: {'default': 400, 'blur': 0} }" ng-enter="searchMatchClick(selectedMatch)" class="user_add" type="text" placeholder="Enter a Materia user's name or e-mail" ng-keydown="searchKeyDown($event)" />
							<div class="search_list" ng-show="searchResults.show">
								<div ng-repeat="match in searchResults.matches" ng-mouseup="searchMatchClick(match)" class="search_match" ng-class="{ focused: selectedMatch == match }">
									<img class="user_match_avatar" ng-src="{{::match.gravatar}}">
									<p class="user_match_name">{{::match.first}} {{::match.last}}</p>
								</div>
							</div>
							<div ng-if="searchResults.none" class="no_match_message">
								<b>No matches found.</b>
								<p>The person you're searching for may need to log in to create an account.</p>
							</div>
						</div>

						<div class="access_list">
							<div ng-repeat="collaborator in perms.collaborators" ng-show="!collaborator.remove || collaborator.warning" class="user_perm">
								<a ng-if="shareable || user.id == collaborator.id" tabindex="0" href="javascript:;" ng-click="removeAccess(collaborator)" class="remove">&#88;</a>
								<img class="avatar" ng-src="{{::collaborator.gravatar}}" />

								<span class="name">{{::collaborator.first}} {{::collaborator.last}}</span>

								<div class="demote_dialogue" ng-show="collaborator.warning">
									<div class="arrow"></div>
									<div class="warning">Are you sure you want to limit <strong>your</strong> access?
									</div>
									<a href="javascript:;" ng-click="cancelDemote(collaborator)" class="no_button">No</a>
									<a href="javascript:;" ng-click="collaborator.warning = false" class="button red action_button yes_button">Yes</a>
								</div>

								<div class="options" >
									<span class="owner">Full</span>
									<span class="undo">Removed <a href="#">Undo</a></span>
									<select ng-disabled="shareable==false" tabindex="0" id="perm" class="perm" ng-model="collaborator.access" ng-change="checkForWarning(collaborator)">
										<option value="30" ng-selected="collaborator.access == 30" >Full</option>
										<option value="0" ng-selected="collaborator.access == 0" >View Scores</option>
									</select>

									<a ng-if="shareable" tabindex="0" class="remove-expiration" role="button" ng-click="removeExpires(collaborator)" ng-show="collaborator.expires">X</a>
									<span class="expires">Expires: </span><input ng-disabled="!shareable" type="text" class="exp-date user{{::collaborator.id}}" ng-model="collaborator.expiresText" readonly="true" />
								</div>
							</div>
						</div>
						<p class="disclaimer">Users with full access can edit or copy this widget and can add or remove people in this list.</p>
						<a tabindex="0" class="cancel_button" ng-click="hideModal()">Cancel</a>
						<a tabindex="0" class="action_button green save_button" ng-click="updatePermissions()">Save</a>
					</div>
				</div>
			</modal-dialog>

			<modal-dialog class="availability" show="show.availabilityModal" dialog-title="Settings" width="660px" height="440px">
				<div ng-controller="WidgetSettingsController">
					<p class="availabilityError" ng-show="error.length > 0">{{error}}</p>
					<ul class="attemptsPopup">
						<li><h3>Attempts</h3>
							<div class="selector" ng-if="show.availabilityModal"></div>
							<ul class="attemptHolder">
								<li id="value_1" ng-class="{selected: attemptsSliderValue == 1}" ng-click="changeSlider(1)">1</li>
								<li id="value_2" ng-class="{selected: attemptsSliderValue == 2}" ng-click="changeSlider(2)">2</li>
								<li id="value_3" ng-class="{selected: attemptsSliderValue == 3}" ng-click="changeSlider(3)">3</li>
								<li id="value_4" ng-class="{selected: attemptsSliderValue == 4}" ng-click="changeSlider(4)">4</li>
								<li id="value_5" ng-class="{selected: attemptsSliderValue == 5}" ng-click="changeSlider(5)">5</li>
								<li id="value_10" class="step first" ng-class="{selected: attemptsSliderValue == 10}" ng-click="changeSlider(10)">10</li>
								<li id="value_15" class="step" ng-class="{selected: attemptsSliderValue == 15}" ng-click="changeSlider(15)">15</li>
								<li id="value_20" class="step" ng-class="{selected: attemptsSliderValue == 20}" ng-click="changeSlider(20)">20</li>
								<li id="value_25" class="step last" ng-class="{selected: attemptsSliderValue == UNLIMITED_SLIDER_VALUE}" ng-click="changeSlider(UNLIMITED_SLIDER_VALUE)">Unlimited</li>
							</ul>
							<p class="data_explination">This is the number of times a student can submit their interaction for a score.  Only the highest attempt score counts.</p>
						</li>
					<ul class="toFrom">
						<li ng-repeat="available in availability"><h3>{{available.header}}</h3>
							<ul class="datePicker">
								<li ng-click="available.anytime = true"><input type="radio" class="anytime availability" ng-checked="available.anytime"/> <label>{{available.anytimeLabel}}</label></li>
								<li ng-click="available.anytime = false">
									<input type="radio" class="specify availability" ng-checked="!available.anytime"/>
									<label>On</label>
									<input type="text" class="date {{available.header == 'Available' ? 'from' : 'to'}}" ng-class="{error: dateError[$index] == true}" placeholder="Date" ng-model="available.date" date-validation validate="date"/> at
									<input type="text" class="time" ng-class="{error: timeError[$index] == true}" placeholder="Time" ng-blur="checkTime($index)" ng-model="available.time" ng-trim="false" date-validation validate="time"/>
									<span class="am ampm" ng-class="{selected: available.period == 'am'}" ng-click="available.period = 'am'">am</span><span class="pm ampm" ng-class="{selected: available.period == 'pm'}" ng-click="available.period = 'pm'">pm</span>
								</li>
							</ul>
						</li>
					<ul class="inline">
						<li><a href class="cancel_button" ng-click="hideModal()">Cancel</a></li>
						<li><a href class="action_button green save" ng-click="parseSubmittedInfo()" ng-click="hideModal()">Save</a></li>
					</ul>
				</div>
			</modal-dialog>

			<modal-dialog class="default csv_popup" show="show.exportModal" width="580px" height="580px">
				<div ng-controller="ExportScoresController">
					<div class="download_wrapper">
						<h3>Export Scores</h3>
						<ul class="options">
							<li><a href class="show_options" ng-click="showOptions()">{{options ? "Hide" : "Semesters..."}}</a></li>
						</ul>

						<h4>{{header || "None Selected"}}</h4>

						<div class="score_table">
							<img src="/themes/default/assets/img/paper_fold.png" />
							<table>
								<tr class="header">
									<th scope="col">User ID</th>
									<th scope="col">User</th>
									<th scope="col">Score</th>
								</tr>
								<tr ng-repeat="data in mockData">
									<td>{{data.userID}}</td>
									<td class="name">{{data.name}}</td>
									<td>{{data.score}}</td>
								</tr>
							</table>
							<span id="sample-notification">Sample</span>
							<div class="download-controls">
								<select ng-model="exportType" ng-options="select.option for select in exportSelect"></select>
								<p class="download"><a href ng-href="{{getDownloadLink()}}" class="action_button arrow_down_button" ng-class="{disabled: !header}"><span class="arrow_down"></span>Download File</a></p>
							</div>
						</div>

						<p class="cancel"><a href ng-click="hideModal()">Cancel</a></p>
					</div>
					<div class="download_options" ng-show="options">
						<h4>Semesters</h4>
						<p class="export_which">Export which semesters?</p>
						<ul>
							<li class="checkallLi" ng-show="semesters.length > 1"><input type="checkbox" id="checkall" value="null" ng-model="checkedAll" ng-click="checkAll()"/><label for="checkall"> - Check all</label></li>
							<li ng-repeat="semester in semesters"><input type="checkbox" id="{{semester.id}}" class="semester" id="{{semester.id}}" ng-model="semester.checked" ng-disabled="semesters.length == 1" ng-click="onSelectedSemestersChange()"/> <label for="{{semester.id}}">{{semester.label}}</label></li>
						</ul>
					</div>
				</div>
			</modal-dialog>

			<modal-dialog class="copy" show="show.copyModal" dialog-title="Make a Copy:" width="620px" height="220px">
				<div class="container">
					<span class="input_label">New Title:</span>
					<input class="newtitle" type="text" ng-model="$parent.$parent.copy_title" placeholder="New Widget Title" />
					<span class="copy_error">Please enter a valid widget title.</span>
					<a class="cancel_button" href="javascript:;" ng-click="hideModal()">Cancel</a>
					<a class="action_button green copy_button" href="javascript:;" ng-click="copyWidget()">Copy</a>
				</div>
			</modal-dialog>
			<section class="directions" ng-show="error">
				<div class="error error-nowidget">
					<p class="errorWindowPara">You do not have access to this widget or this widget does not exist.</p>
				</div>
			</section>
			<section class="directions unchosen" ng-show="widgets.widgetList.length > 0 && !selected.widget && !error">
				<h1>Your Widgets</h1>
				<p>Choose a widget from the list on the left.</p>
			</section>
			<section class="directions" ng-show="widgets.widgetList.length == 0 && !error">
				<h1>You have no widgets!</h1>
				<p>Make a new widget in the widget catalog.</p>
			</section>
			<section class="page"  ng-hide="widgets.widgetList.length == 0 || !selected.widget && !error">
				<div class="header">
					<h1>{{selected.widget.name}}</h1>
					<span class="widgetname">{{selected.widget.widget.name}}</span>
				</div>
				<div class="overview">
					<div class="icon_container med_{{ beard }}" ng-class="{ big_bearded: beard }">
						<img class="icon" ng-src='{{selected.widget.iconbig}}' height="275px" width="275px"/>
					</div>
					<div class="controls">
						<ul>
							<li>
								<a id="preview_button" class="action_button green circle_button" target="_blank" href="{{selected.preview}}" ng-class="{'disabled': !selected.widget.widget.is_playable}">
									<span class="arrow arrow_right"></span>
									Preview
								</a>
							</li>
							<li>
								<a id="edit_button" class="action_button aux_button" ng-class="{'disabled' : selected.editable==false}" ng-disabled="{{selected.editable}}" ng-click="editWidget()">
									<span class="pencil"></span>
									Edit Widget
								</a>
							</li>
						</ul>
						<ul class="options">
							<li class="share"><div class="link" ng-click="showCollaboration()">Collaborate{{ collaborateCount }}</div></li>
							<li class="copy" ng-class="{'disabled' : selected.accessLevel == 0}"><div class="link" id="copy_widget_link" ng-class="{'disabled' : selected.accessLevel == 0}" ng-click="showCopyDialog()">Make a Copy</div></li>
							<li class="delete" ng-class="{'disabled' : selected.accessLevel == 0}"><div class="link" id="delete_widget_link" ng-class="{'disabled' : selected.accessLevel == 0}" ng-click="showDelete()">Delete</div></li>
						</ul>
						<div class="delete_dialogue" ng-show="show.deleteDialog">
							<span class="delete-warning">Are you sure you want to delete this widget?</span>
							<a class="cancel_button" href="javascript:;" ng-click="show.deleteDialog = false">Cancel</a>
							<a class="action_button red delete_button" href="javascript:;" ng-click="deleteWidget()">Delete</a>
						</div>
						<div class="additional_options" ng-class="{'disabled': !selected.editable || !selected.shareable}" ng-show="!show.deleteDialog">
							<h3>Settings:</h3>
							<dl class="attempts_parent" ng-class="{'disabled': !selected.editable || !selected.shareable}">
								<dt>Attempts:</dt>
								<dd ng-class="{'disabled':!selected.editable || !selected.shareable}" ng-click="popup()">
									{{ attemptText }}
								</dd>
								<dt>Available:</dt>
								<dd ng-class="{'disabled':!selected.editable || !selected.shareable}" ng-click="popup()" ng-switch="availabilityMode">
									<span ng-switch-when="anytime">
										Anytime
									</span>
									<span ng-switch-when="open until">
										Open until <span class="available_date">{{ availability.end.date }}</span> at <span class="available_time">{{ availability.end.time }}</span>
									</span>
									<span ng-switch-when="anytime after">
										Anytime after <span class="available_date">{{ availability.start.date }}</span> at <span class="available_time">{{ availability.start.time }}</span>
									</span>
									<span ng-switch-when="from">
										From <span class="available_date">{{ availability.start.date }}</span> at <span class="available_time">{{ availability.start.time }}</span> until <span class="available_date">{{ availability.end.date }}</span> at <span class="available_time">{{ availability.end.time}}</span>
									</span>
								</dd>
							</dl>
							<a id="edit-availability-button" role="button" ng-class="{'disabled': !selected.editable || !selected.shareable}" href ng-disabled="!selected.editable" ng-click="popup()">Edit settings...</a>
						</div>
					</div>
					<div class="share-widget-container closed" ng-class="{'draft' : !selected.widget.is_draft}" ng-disabled="selected.editable">
						<h3>{{selected.shareable ? "Share" : "Publish to share"}} with your students</h3>
						<input id="play_link" type="text" ng-disabled="!selected.shareable" ng-disabled="!selected.shareable" value="{{baseUrl}}play/{{selected.widget.id}}/{{selected.widget.clean_name}}"/>
						<p>Copy the link code &amp; paste it in an online course or class assignment (or <span class="show-embed link" ng-click="embedToggle = !embedToggle">use the embed code</span>).</p>
						<textarea id="embed_link" ng-show="embedToggle && selected.shareable">{{ getEmbedLink() }}</textarea>
					</div>
				</div>
				<div class="scores" ng-show="selected.shareable && selected.widget.widget.is_scorable">
					<h2>Student Activity</h2>
					<span id="export_scores_button" class="action_button aux_button" ng-disabled="selected.scores.list.length == 0 || !hasScores" ng-class="{'disabled': selected.scores.list.length == 0}" ng-click="exportPopup()">
						<span class="arrow_down"></span>
						Export Scores
					</span>

					<div class="scoreWrapper" ng-repeat="semester in selected.scores.list" ng-if="selected.showOlderScores == true || $index == 0">
						<h3 class="view">{{semester.term}} {{semester.year}}</h3>
						<ul class="choices">
							<li ng-class="{'scoreTypeSelected' : selectedScoreView[$index] == SCORE_VIEW_GRAPH}"><a class="graph" ng-show="semester.distribution" ng-click="setScoreView($index, SCORE_VIEW_GRAPH)">Graph</a></li>
							<li ng-class="{'scoreTypeSelected' : selectedScoreView[$index] == SCORE_VIEW_TABLE}"><a class="table" ng-show="semester.distribution" ng-click="setScoreView($index, SCORE_VIEW_TABLE)">Individual Scores</a></li>
							<li ng-class="{'scoreTypeSelected' : selectedScoreView[$index] == SCORE_VIEW_DATA}"><a class="data" ng-show="semester.storage" ng-click="setScoreView($index, SCORE_VIEW_DATA)">Data</a></li>
						</ul>
						<div score-table class="display table" id="table_{{semester.id}}" data-term="{{semester.term}}" data-year="{{semester.year}}" ng-show="selectedScoreView[$index] == SCORE_VIEW_TABLE">
							<div class="score-search">
								<input type="text" ng-model="studentSearch" ng-change="searchStudentActivity(studentSearch)" placeholder="Search Students" />
							</div>
							<h3>Select a student to view their scores.</h3>
							<div class="scoreListContainer">
								<!-- <div class="scoreListTitle"></div> -->
								<div class="scoreListScrollContainer">
									<table class="scoreListTable">
										<tbody>
											<tr ng-repeat="user in users track by user.uid" id="{{$index}}" ng-class="{'rowSelected' : user.uid == selectedUser.uid}">
												<td class="listName" ng-click="setSelectedUser(user.uid)">{{user.name}}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
							<div class="scoreTableContainer" ng-hide="selectedUser == null">
								<!-- <div class="scoreTableTitle"></div> -->
								<table class="scoreTable">
									<tbody>
										<tr ng-repeat="score in selectedUser.scores" ng-click="showScorePage(score.id)">
											<td>{{score.date.substring(0, 10)}}</td>
											<td>{{ score.complete == "1" ? score.percent + "%" : "---" }}</td>
											<td>{{score.elapsed}}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div class="display graph" ng-show="selectedScoreView[$index] == SCORE_VIEW_GRAPH">
							<div score-graph class="chart" id="chart_{{semester.id}}"></div>
						</div>
						<div score-data id="data_{{semester.id}}" class="display data" data-semester="{{semester.year}} {{semester.term.toLowerCase()}}" data-has-storage="{{ semester.storage ? true : false }}" ng-show="selectedScoreView[$index] == SCORE_VIEW_DATA">
							<a class="storage" ng-click="handleStorageDownload()">Download Table</a>
							<div class="table label" ng-show="tableNames.length == 1"><h4>Table: <span>{{tableNames[0]}}</span></h4></div>
							<select ng-model="selectedTable" ng-options="tableName as tableName for tableName in tableNames" ng-show="tableNames.length > 1"></select>
							<div ng-repeat="table in tables" ng-show="tableNames[$index] == selectedTable">
								<p ng-if="table.truncated" class="truncated-table">Showing only the first {{MAX_ROWS}} entries of this table. Download the table to see all entries.</p>
								<table class="storage_table" datatable>
									<thead>
										<tr>
											<th>user</th>
											<th>firstName</th>
											<th>lastName</th>
											<th>time</th>
											<th ng-repeat="(name, data) in table.data[0].data">{{name}}</th>
										</tr>
									</thead>
									<tbody>
										<tr ng-repeat="row in table.data">
											<td>{{row.play.user}}</td>
											<td>{{row.play.firstName}}</td>
											<td>{{row.play.lastName}}</td>
											<td>{{row.play.time}}</td>
											<td ng-repeat="rowData in row.data" ng-class="{'null':rowData == null}">{{rowData}}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<ul class="numeric" ng-show="selectedScoreView[$index] != SCORE_VIEW_DATA">
							<li><h4>Students</h4><p class="players" class="playerShrink">{{semester.students}}</p></li>
							<li><h4>Scores</h4><p class="score-count">{{semester.totalScores}}</p></li>
							<li><h4>Avg Final Score</h4><p class="final-average">{{semester.average}}</p></li>
						</ul>
						<a role="button" class="show-older-scores-button" href="#" ng-show="selected.scores.list.length > 1 && selected.show.olderScores == false && $index == 0" ng-click="enableOlderScores()">Show older scores...</a>
					</div>
					<p class="noScores" ng-show="selected.scores.list.length == 0">There are no scores to display</p>
				</div>
			</section>
		</div>
		<aside ng-controller="SidebarController">
			<div class="top">
				<h1>Your Widgets:</h1>
			</div>
			<div class="search">
				<div   class="textbox-background"></div>
				<input class="textbox" ng-model="query" type="text">
				<div   class="search-icon"></div>
				<div   class="search-close" ng-click="query = ''" ng-show="query">x</div>
			</div>
			<div class="courses">
				<div class="widget_list" data-container="widget-list">
					<div ng-repeat="widget in widgets.widgetList | filter:query" id="widget_{{widget.id}}" class="widget small_{{ widget.beard }}" ng-class-odd="'odd'" ng-class-even="'even'" ng-class="{is_draft: widget.is_draft, gameSelected: widget.id == selected.widget.id, bearded: widget.beard}" ng-click="setSelected(widget.id)">
						<img class="icon" ng-src="{{widget.icon}}"/>
						<ul>
							<li class="title searchable" ng-bind-html="widget.name | highlight:query"></li>
							<li class="type searchable" ng-bind-html="widget.widget.name | highlight:query"></li>
							<li class="score">{{widget.is_draft ? "Draft" : ""}}</li>
						</ul>
					</div>
				</div>
			</div>
		 </aside>
	</div>
</div>
