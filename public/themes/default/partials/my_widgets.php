<div class="container" ng-controller="mywidgetsCtrl">
	<section class="directions">
		<h1>Your Widgets</h1>
		<p>Choose a widget from the list on the left.</p>
	</section>
	<section class="page">
		<hgroup>
			<h1>_template_title</h1>
			<h3>_template_type</h3>
		</hgroup>
		<div class="overview">
			<div class="icon_container">
				<img class="icon" src='/assets/img/default/default-icon-275.png' height="275px" width="275px"/>
			</div>
			<div class="controls">
				<ul>
					<li>
						<a id="preview_button" class="action_button green circle_button" target="_blank">
							<span class="arrow arrow_right"></span>
							Preview
						</a>
					</li>
					<li>
						<a id="edit_button" class="action_button aux_button">
							<span class="pencil"></span>
							Edit Widget
						</a>
					</li>
				</ul>
				<ul class="options">
					<li class="share"><a href="#" id="share_widget_link">Collaborate</a></li>
					<li class="copy"><a href="#" id="copy_widget_link">Make a Copy</a></li>
					<li class="delete"><a href="#" id="delete_widget_link">Delete</a></li>
				</ul>
				<div class="delete_dialogue">
					<span class="delete-warning">Are you sure you want to delete this widget?</span>
					<a class="cancel_button" href="#">Cancel</a>
					<a class="action_button red delete_button" href="#">Delete</a>
				</div>
				<div class="additional_options">
					<h3>Settings:</h3>
					<dl class="attempts_parent">
						<dt>Attempts:</dt>
						<dd id="attempts"></dd>
						<dt>Available:</dt>
						<dd id="avaliability"></dd>
					</dl>
					<a id="edit-avaliability-button" role="button" href="#">Edit settings...</a>
				</div>
			</div>
			<div class="share-widget-container closed">
				<h3>Share with your students</h3>
				<input id="play_link" type="text"/>
				<p>Copy the link code &amp; paste it in an online course or class assignment (or <span class="show-embed link">use the embed code</span>).</p>
				<textarea id="embed_link"><iframe src="<?= Uri::base() ?>embed/847" width="800" height="634" style="margin:0;padding:0;border:0;">Oops! There was a problem displaying this Kogneato Widget. Try a direct <?= Html::anchor('play/847', 'link') ?>.</iframe></textarea>
			</div>
		</div>
		<div class="scores">
			<h2>Student Activity</h2>
			<span id="export_scores_button" class="action_button aux_button">
				<span class="arrow_down"></span>
				Export Scores
			</span>
			<div class="scoreWrapper">
				<h3 class="view">Semester X</h3>
				<ul class="choices">
					<li class="scoreTypeSelected"><a class="graph" href="#">Graph</a></li>
					<li><a class="table" href="#">Individual Scores</a></li>
					<li><a class="data" href="#">Data</a></li>
				</ul>
				<div class="display table">
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
				<div class="display graph">
					<div class="chart"></div>
				</div>
				<div class="display data">
				</div>
				<ul class="numeric">
					<li><h4>Students</h4><p class="players" class="playerShrink">&nbsp;</p></li>
					<li><h4>Scores</h4><p class="score-count">&nbsp;</p></li>
					<li><h4>Avg Final Score</h4><p class="final-average">&nbsp;</p></li>

				</ul>
				<a role="button" class="show-older-scores-button" href="#">Show older scores...</a>
			</div>
			<p class="noScores">There are no scores to display</p>
		</div>
	</section>
	<aside>
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
				<div id="_template_gameID" class="template _template_evenOdd" data-course="uncategorized" data-template="widget-list" data-created='0'>
					<img class="icon"/>
					<ul>
						<li class="title searchable">_template_title</li>
						<li class="type searchable">_template_type</li>
						<li class="score"></li>
					</ul>
				</div>
			</div>
		</div>
	 </aside>
</div>

<script type="text/template" id="t-error"><div class="error error-nowidget"><p class="errorWindowPara">You do not have access to this widget or this widget does not exist.</p></div></script>

<script type="text/template" id="t-availibility"><h2>Settings</h2>
<ul class="attemptsPopup">
	<li><h3>Attempts</h3>
		<div class="selector"></div>
		<ul class="attemptHolder">
			<li id="value_1">1</li>
			<li id="value_2">2</li>
			<li id="value_3">3</li>
			<li id="value_4">4</li>
			<li id="value_5">5</li>
			<li id="value_10" class="step first">10</li>
			<li id="value_15" class="step">15</li>
			<li id="value_20" class="step">20</li>
			<li id="value_25" class="step last">Unlimited</li>
		</ul>
		<p class="data_explination">This is the number of times a student can submit their interaction for a score.  Only the highest attempt score counts.</p>
	</li>
<ul class="toFrom">
	<li><h3>Available</h3>
		<ul class="datePicker">
			<li><input type="radio" name="fromAvailability" class="anytime availability" id="anytimeFrom"/> <label for="anytimeFrom">Now</label></li>
			<li><input type="radio"  name="fromAvailability" class="specify availability" id="specifyFrom"/> <label for="specifyFrom">On</label> <input type="text" class="date from" placeholder="Date"/> at <input type="text" id="startTime" class="time" placeholder="Time" /> <span class="am start ampm">am</span><span class="pm start ampm">pm</span></li>
		</ul>
	</li>
	<li><h3>Closes</h3>
		<ul class="datePicker">
			<li><input type="radio" name="toAvailability" class="anytime availability" id="anytimeTo" /> <label for="anytimeTo">Never</label></li> 
			<li><input type="radio"  name="toAvailability" class="specify availability" id="specifyTo" /> <label for="specifyTo">On</label> <input type="text" class="date to" placeholder="Date" /> at <input type="text" id="endTime" class="time" placeholder="Time" /> <span class="am end ampm">am</span><span class="pm end ampm">pm</span></li>
		</ul>
		<p class="data_explination">These fields define when a student can access your widget.</p>
	</li>
</ul>

<ul class="inline">
	<li><a href="#" class="cancel_button">Cancel</a></li>
	<li><a href="#" class="action_button green save">Save</a></li>
</ul></script>

<script type="text/template" id="t-copy-popup"><h2>Make a Copy:</h2>
<div class="container">
	<span class="input_label">New Title:</span><input class="newtitle" type="text" placeholder="New Widget Title" />
	<span class="copy_error">Please enter a valid widget title.</span>
	<a class="cancel_button" href="#">Cancel</a>
	<a class="action_button green copy_button" href="#">Copy</a>
</div></script>

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

<script type="text/template" id="t-share-popup"><h2>Collaboration:</h2>
<div id="access" class="container">
	<div class="list_tab_lock">
		<span class="input_label">Add people:</span><input tabindex="0" class="user_add" type="text" placeholder="Enter a Materia user's name or e-mail"/>
		<div class="search_list"></div>
	</div>
	<div class="access_list"></div>
	<p class="disclaimer">Users with full access can edit or copy this widget and can add or remove people in this list.</p>
	<a tabindex="0" class="cancel_button">Cancel</a>
	<a tabindex="0" class="action_button green save_button">Save</a>
</div></script>

<script type="text/template" id="t-share-person"><a tabindex="0" href="#" class="remove">&#88;</a>
<img class="avatar"/>

<span class="name"></span>

<div class="options">
	<span class="owner">Full</span>
	<span class="undo">Removed <a href="#">Undo</a></span>
	<select tabindex="0" id="perm" class="perm">
		<option value="30">Full</option>
		<option value="0">View Scores</option>
	</select>

	<a tabindex="0" href="#" class="remove-expiration" role="button">X</a>
	<span class="expires">Expires: </span><input type="text" class="exp-date" readonly="true" />

</div></script>

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
