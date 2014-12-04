<div class="container" ng-app="MyWidgets">
	<div ng-controller="SelectedWidgetController">
		<div ng-controller="CollaborationController" class="popup light share" ng-show="$parent.showCollaborationModal">
			<h2>Collaboration:</h2>
			<div id="access" class="container">
				<div class="list_tab_lock">
					<span class="input_label">Add people:</span><input tabindex="0" ng-model="user_add" class="user_add" type="text" placeholder="Enter a Materia user's name or e-mail" ng-change="search(user_add)" />
					<div class="search_list" ng-show="searching">
						<div ng-show="searchResults.length == 0">
							<p class="no_match_message">No matches found.</p>
							<p class="no_match_reason">The person you're searching for may need to log in to create an account.</p>
						</div>
						<div ng-repeat="result in searchResults" ng-click="searchMatchClick(result)" class="search_match">
							<img class="user_match_avatar" ng-src="{{ result.gravatar }}">
							<p class="user_match_name">{{ result.first }} {{ result.last }}</p>
						</div>
					</div>
				</div>
				<div class="access_list">
					<div ng-repeat="user in $parent.collaborators" ng-show="!user.remove" class="user_perm">
						<a tabindex="0" href="javascript:;" ng-click="removeAccess(user)" class="remove">&#88;</a>
						<img class="avatar" ng-src="{{ user.gravatar }}" />

						<span class="name">{{ user.first }} {{ user.last }}</span>

						<div class="demote_dialogue" ng-show="user.warning">
							<div class="arrow"></div>
							<div class="warning">Are you sure you want to limit <strong>your</strong> access?
							</div>
							<a href="javascript:;" ng-click="cancelDemote(user)" class="no_button">No</a>
							<a href="javascript:;" ng-click="user.warning = false" class="button red action_button yes_button">Yes</a>
						</div>

						<div class="options">
							<span class="owner">Full</span>
							<span class="undo">Removed <a href="#">Undo</a></span>
							<select tabindex="0" id="perm" class="perm" ng-model="user.access" ng-change="checkForWarning(user)">
								<option value="30" {{ user.access == 30 ? "selected" : ""}}>Full</option>
								<option value="0" {{ user.access == 0 ? "selected" : ""}}>View Scores</option>
							</select>

							<a tabindex="0" class="remove-expiration" role="button" ng-click="removeExpires(user)" ng-show="user.expires">X</a>
							<span class="expires">Expires: </span><input type="text" class="exp-date user{{ user.id }}" ng-model="user.expiresText" readonly="true" />

						</div>
					</div>
				</div>
				<p class="disclaimer">Users with full access can edit or copy this widget and can add or remove people in this list.</p>
				<a tabindex="0" class="cancel_button" ng-click="$parent.showCollaborationModal = false">Cancel</a>
				<a tabindex="0" class="action_button green save_button" ng-click="updatePermissions($parent.collaborators)">Save</a>
			</div>
		</div>
		<section class="directions unchosen" ng-show="noWidgetState == false">
			<h1>Your Widgets</h1>
			<p>Choose a widget from the list on the left.</p>
		</section>
		<section class="directions" ng-show="noWidgetState == true">
			<h1>You have no widgets!</h1>
			<p>Make a new widget in the widget catalog.</p>
		</section>
		<section class="page"  ng-hide="noWidgetState == true">
			<hgroup>
				<h1>{{selectedWidget.name}}</h1>
				<h3>{{selectedWidget.widget.name}}</h3>
			</hgroup>
			<div class="overview">
				<div class="icon_container med_{{ beard }}" ng-class="{ big_bearded: beard }">
					<img class="icon" ng-src='{{selectedWidget.iconbig}}' height="275px" width="275px"/>
				</div>
				<div class="controls">
					<ul>
						<li>
							<a id="preview_button" class="action_button green circle_button" target="_blank" href="{{preview}}" ng-class="{'disabled': !selectedWidget.widget.is_playable}">
								<span class="arrow arrow_right"></span>
								Preview
							</a>
						</li>
						<li>
							<a id="edit_button" class="action_button aux_button" ng-class="{'disabled' : editable==false}" ng-disabled="{{editable}}" ng-href="{{edit}}">
								<span class="pencil"></span>
								Edit Widget
							</a>
						</li>
					</ul>
					<ul class="options">
						<li class="share"><a href="javascript:;" ng-click="showCollaboration()">Collaborate{{ collaborateCount }}</a></li>
						<li class="copy" ng-class="{'disabled' : accessLevel == 0}"><a href="#" id="copy_widget_link" ng-class="{'disabled' : accessLevel == 0}" ng-disabled="" ng-click="copyToggled = true">Make a Copy</a></li>
						<li class="delete" ng-class="{'disabled' : accessLevel == 0}"><a href="#" id="delete_widget_link" ng-class="{'disabled' : accessLevel == 0}"  ng-click="deleteToggled = !deleteToggled">Delete</a></li>
					</ul>
					<div class="delete_dialogue" ng-show="deleteToggled">
						<span class="delete-warning">Are you sure you want to delete this widget?</span>
						<a class="cancel_button" href="javascript:;" ng-click="deleteToggled = false">Cancel</a>
						<a class="action_button red delete_button" href="javascript:;" ng-click="deleteWidget()">Delete</a>
					</div>
					<div class="additional_options" ng-class="{'disabled': !editable || !shareable}" ng-show="!deleteToggled">
						<h3>Settings:</h3>
						<dl class="attempts_parent" ng-class="{'disabled': !editable || !shareable}">
							<dt>Attempts:</dt>
							<dd id="attempts" ng-class="{'disabled':!editable || !shareable}"></dd>
							<dt>Available:</dt>
							<dd id="avaliability" ng-class="{'disabled':!editable || !shareable}"></dd>
						</dl>
						<a id="edit-avaliability-button" role="button" ng-class="{'disabled': !editable || !shareable}" href="#" ng-disabled="!editable">Edit settings...</a>
					</div>
					<div class="copy_dialogue popup light copy" ng-show="copyToggled">
						<h2>Make a Copy:</h2>
						<div class="container">
							<span class="input_label">New Title:</span>
							<input class="newtitle" type="text" ng-model="copy_title" placeholder="New Widget Title" />
							<span class="copy_error">Please enter a valid widget title.</span>
							<a class="cancel_button" href="javascript:;" ng-click="copyToggled = false">Cancel</a>
							<a class="action_button green copy_button" href="javascript:;" ng-click="copyWidget()">Copy</a>
						</div>
					</div>
				</div>
				<div class="share-widget-container closed" ng-class="{'draft' : !shareable}" ng-disabled="editable">
					<h3>{{shareable ? "Share" : "Publish to share"}} with your students</h3>
					<input id="play_link" type="text" ng-disabled="!shareable" ng-disabled="!shareable" value="{{baseUrl}}play/{{selectedWidget.id}}/{{selectedWidget.clean_name}}"/>
					<p>Copy the link code &amp; paste it in an online course or class assignment (or <span class="show-embed link" ng-click="embedToggle = !embedToggle">use the embed code</span>).</p>
					<textarea id="embed_link" ng-show="embedToggle && shareable">{{ getEmbedLink() }}</textarea>
				</div>
			</div>
			<div class="scores" ng-show="shareable && selectedWidget.widget.is_scorable">
				<h2>Student Activity</h2>
				<span id="export_scores_button" class="action_button aux_button" ng-disabled="scores.list.length == 0 || !hasScores" ng-class="{'disabled': scores.list.length == 0}">
					<span class="arrow_down"></span>
					Export Scores
				</span>
				<div class="scoreWrapper" ng-show="scores.list.length > 0 || storageNotScoreData">
					<h3 class="view">Semester X</h3>
					<ul class="choices">
						<li ng-class="{'scoreTypeSelected' : selectedScoreView == viewGraph}"><a class="graph" href="#" ng-show="!storageNotScoreData" ng-click="setScoreView(viewGraph)">Graph</a></li>
						<li ng-class="{'scoreTypeSelected' : selectedScoreView == viewTable}"><a class="table" href="#" ng-show="!storageNotScoreData" ng-click="setScoreView(viewTable)">Individual Scores</a></li>
						<li ng-class="{'scoreTypeSelected' : selectedScoreView == viewData}"><a class="data" href="#" ng-click="setScoreView(viewData)">Data</a></li>
					</ul>
					<div class="display table" ng-show="selectedScoreView == viewTable">
						<div class="score-search">
							<input type="text" placeholder="Search Students" />
						</div>
						<h3>Select a student to view their scores.</h3>
						<div class="scoreListContainer">
							<!-- <div class="scoreListTitle"></div> -->
							<div class="scoreListScrollContainer">
								<table class="scoreListTable"></table>
							</div>
						</div>
						<div class="scoreTableContainer">
							<!-- <div class="scoreTableTitle"></div> -->
							<table class="scoreTable"></table>
						</div>
					</div>
					<div class="display graph" ng-show="selectedScoreView == viewGraph">
						<div class="chart"></div>
					</div>
					<div class="display data" ng-show="selectedScoreView == viewData">
					</div>
					<ul class="numeric" ng-show="selectedScoreView != data">
						<li><h4>Students</h4><p class="players" class="playerShrink">&nbsp;</p></li>
						<li><h4>Scores</h4><p class="score-count">&nbsp;</p></li>
						<li><h4>Avg Final Score</h4><p class="final-average">&nbsp;</p></li>

					</ul>
					<a role="button" class="show-older-scores-button" href="#" ng-show="scores.list.length > 1">Show older scores...</a>
				</div>
				<p class="noScores" ng-show="scores.list.length == 0">There are no scores to display</p>
			</div>
		</section>
	</div>
	<aside ng-controller="SidebarController">
		<div class="top">
			<h1>Your Widgets:</h1>
		</div>
		<div class="search">
			<div   class="textbox-background"></div>
			<input class="textbox" type="text">
			<div   class="search-icon"></div>
			<div   class="search-close">x</div>
		</div>
		<div class="courses">
			<div class="widget_list" data-container="widget-list">
				<div ng-repeat="instance in widgets" id="{{instance.id}}" class="widget" ng-class="{'even' : ($index + 1) % 2 == 0, 'odd': ($index + 1) % 2 != 0, 'is_draft' : instance.is_draft, 'gameSelected': instance.id == selectedWidget.id}" ng-click="setSelected(instance.id)">
					<img class="icon" ng-src="{{instance.icon}}" />
					<ul>
						<li class="title searchable">{{instance.name}}</li>
						<li class="type searchable">{{instance.widget.name}}</li>
						<li class="score">{{instance.is_draft == true ? 'Draft' : ''}}</li>
					</ul>
				</div>
			</div>
			<!--
			<div class="widget_list" data-container="widget-list">
				<div ng-repeat="widget in widgets" id="_template_gameID" class="template _template_evenOdd" data-course="uncategorized" data-template="widget-list" data-created='0'>
					<ul>
						<li class="title searchable">_template_title</li>
						<li class="type searchable">_template_type</li>
						<li class="score"></li>
					</ul>
				</div>
			</div>
			-->
		</div>
	 </aside>
	<!-- begin -->
	<div ng-controller="WidgetSettingsController" id="popup" class="light availability">
		<h2>Settings</h2>
		<p class="availabilityError" ng-show="errors.type.length > 0">{{errors.type[0]}}{{errors.type[1] ? "s and " + errors.type[1] + "s are" : " is"}} {{errors.reason[0]}}{{errors.reason[1] ? "/" + errors.reason[1] : ""}}.</p>
		<ul class="attemptsPopup">
			<li><h3>Attempts</h3>
				<div class="selector"></div>
				<ul class="attemptHolder">
					<li id="value_1" ng-class="{selected: selectedWidget.attempts == 1}">1</li>
					<li id="value_2" ng-class="{selected: selectedWidget.attempts == 2}">2</li>
					<li id="value_3" ng-class="{selected: selectedWidget.attempts == 3}">3</li>
					<li id="value_4" ng-class="{selected: selectedWidget.attempts == 4}">4</li>
					<li id="value_5" ng-class="{selected: selectedWidget.attempts == 5}">5</li>
					<li id="value_10" class="step first" ng-class="{selected: selectedWidget.attempts == 10}">10</li>
					<li id="value_15" class="step" ng-class="{selected: selectedWidget.attempts == 15}">15</li>
					<li id="value_20" class="step" ng-class="{selected: selectedWidget.attempts == 20}">20</li>
					<li id="value_25" class="step last" ng-class="{selected: selectedWidget.attempts == -1}">Unlimited</li>
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
						<input type="text" class="date {{available.header == 'Available' ? 'from' : 'to'}}" placeholder="Date" ng-model="available.date"/> at
						<input type="text" class="time" placeholder="Time" ng-blur="checkTime($index)" ng-model="available.time"/>
						<span class="am ampm" ng-class="{selected: available.period == 'am'}" ng-click="changePeriod($index, 'am')">am</span><span class="pm ampm" ng-class="{selected: available.period == 'pm'}" ng-click="changePeriod($index, 'pm')">pm</span>
					</li>
				</ul>
			</li>
		<ul class="inline">
			<li><a href="#" class="cancel_button">Cancel</a></li>
			<li><a href class="action_button green save" ng-click="parseSubmittedInfo()">Save</a></li>
		</ul>
	</div>
	<!-- end -->
</div>

<script type="text/template" id="t-error"><div class="error error-nowidget"><p class="errorWindowPara">You do not have access to this widget or this widget does not exist.</p></div></script>

<script type="text/template" id="t-edit-widget-published"><h2>Warning About Editing Published Widgets:</h2>
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
		<a class="cancel_button" href="#">Cancel</a>
		<a class="action_button green" href="#">Edit Published Widget</a>
	</span>
</div></script>

<?= Theme::instance()->view('partials/notification') ?>

<script type="text/template" id="t-csv"><div class="download_wrapper">
	<h3>Export Scores</h3>
	<ul class="options">
		<li><a href="#" class="show_options">Semesters...</a></li>
	</ul>

	<h4>(None Selected)</h4>

	<div class="score_table">
		<img src="/assets/img/paper_fold.png" />
		<table>
			<tr class="header">
				<th scope="col">User ID</th>
				<th scope="col">User</th>
				<th scope="col">Score</th>
			</tr>
			<tr>
				<td>fw33255p</td>
				<td class="name">Felix Wembly</td>
				<td>94</td>
			</tr>
			<tr>
				<td>gm42334a</td>
				<td class="name">Gillis Mokey</td>
				<td>35</td>
			</tr>
			<tr>
				<td>ha432343s</td>
				<td class="name">Herkimer Archbanger</td>
				<td>100</td>
			</tr>
			<tr>
				<td>fg3421tr</td>
				<td class="name">Fiona Gobo</td>
				<td>100</td>
			</tr>
			<tr>
				<td>mr2342123d</td>
				<td class="name">Marvin Red</td>
				<td>43</td>
			</tr>
			<tr>
				<td>mt343223o</td>
				<td class="name">Morris Tosh</td>
				<td>93</td>
			</tr>
			<tr>
				<td>pf32343t3</td>
				<td class="name">Phil Feenie</td>
				<td>67</td>
			</tr>
			<tr>
				<td>lf33422i</td>
				<td class="name">Lou Firechief</td>
				<td>0</td>
			</tr>
			<tr>
				<td>cb3311rt</td>
				<td class="name">Cantus Blundig</td>
				<td>59</td>
			</tr>
		</table>
		<span id="sample-notification">Sample</span>
		<div class="download-controls">
			<select id="export-select">
				<option value="csv" selected>Scores</option>
				<option value="raw">All raw data</option>
			</select>
			<p class="download"><a href="#" class="action_button arrow_down_button"><span class="arrow_down"></span>Download File</a></p>
		</div>
	</div>

	<p class="cancel"><a href="#">Cancel</a></p>
</div>
<div class="download_options">
	<h4>Semesters</h4>
	<p class="export_which">Export which semesters?</p>
	<ul>
		<li class="checkallLi"><input type="checkbox" id="checkall" value="null"/><label for="checkall"> - Check all</label></li>
		<li><input type="checkbox" class="semester" value="_template_semester" /> <label>_template_semester <span>(_template_count)</span></label></li>
	</ul>
</div></script>
