<article class="container" ng-class="{ show: show }" ng-controller="ScorePageController">
	<header class="header score-header" ng-class="{ preview: isPreview }" ng-show="!restricted && !expired">
		<nav class="header-element previous-attempts {{ prevAttemptClass }}" ng-hide="hidePreviousAttempts || isPreview || guestAccess" ng-mouseover="prevMouseOver()" ng-mouseout="prevMouseOut()">
			<h1 ng-click="prevClick()">Prev. Attempts</h1>
			<ul ng-mouseover="prevMouseOver()">
				<li ng-repeat="attempt in attempts" ng-init="num = attempts.length - $index">
					<a href="#attempt-{{ num }}" ng-click="attemptClick()">Attempt {{ num }}: <span class="score">{{ attempt.roundedPercent }}%</span> <span class="date">{{ dates[$index] }}</span>
				</a></li>
			</ul>
		</nav>

		<h1 class="header-element widget-title" ng-style="headerStyle">{{ widget.title }}</h1>

		<nav class="play-again header-element">
			<h1>
				<a id="play-again" ng-hide="hidePlayAgain" class="action_button" href="{{ playAgainUrl }}">
					{{ isPreview ? 'Preview' : 'Play' }} Again
					<span ng-show="attemptsLeft > 0">({{ attemptsLeft }} Left)</span>
				</a>
			</h1>
		</nav>
	</header>
	<section class="overview" ng-class="{ preview: isPreview }" ng-show="showScoresOverview && !restricted && !expired">
		<div id='overview-incomplete' ng-hide="overview.complete">
			<h2>Incomplete Attempt</h2>
			<hr/>
			<p>
				This student didn't complete this attempt.
				This score was not counted in any linked gradebooks and is only available for informational purposes.
			</p>
		</div>
		<div id="overview-score">
			<h1 ng-if="!guestAccess">Attempt <span class="attempt-num">{{ attempt_num }}</span> Score:</h1>
			<h1 ng-if="guestAccess">This Attempt Score:</h1>
			<span class="overall_score">{{ overview.score }}<span class="percent">%</span></span>
			<div id="class-rank-button" class="action_button gray" ng-hide="isPreview" ng-click="toggleClassRankGraph()">{{ classRankText }}</div>
		</div>
		<div id="overview-table">
			<table>
				<tbody>
					<tr ng-repeat="row in overview.table track by $index">
						<td>{{ row.message }}</td>
						<td class="{{ (row.value > -1) ? 'positive' : 'negative' }} number">
							{{ row.value }}{{ (row.symbol == null) ? '%' : row.symbol }}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="score-graph" ng-show="!restricted && !expired">
		<div class="graph">
			<div id="graph">
			</div>
		</div>
	</section>

	<iframe id="container"
		class="html"
		scrolling="yes"
		ng-attr-src="{{ htmlPath }}"
		ng-class="{ 'margin-above': showScoresOverview,'margin-below': showResultsTable }"
		ng-show="customScoreScreen && !expired && !restricted"
		fullscreen-dir>
	</iframe>

	<section class="details" ng-repeat="detail in details" ng-show="showResultsTable && !restricted && !expired">
		<h1>{{ detail.title }}</h1>

		<table>
			<thead>
				<tr class="details_header">
					<th ng-repeat="header in detail.header">{{ header }}</th>
				</tr>
			</thead>
			<tbody>
				<tr class="{{ row.style }}" ng-class="{ has_feedback: row.feedback != null }" ng-repeat-start="row in detail.table">
					<td class="index" ng-if="row.graphic != 'none'">
						<canvas class="question-number" id="question-{{ $parent.$parent.$index+1 }}-{{ $index+1 }}" >
							<p>{{ $index+1 }}</p>
						</canvas>
						<span ng-if="row.display_score">
							{{ row.score }}{{ row.symbol }}
						</span>
					</td>
					<td class="{{ row.data_style[$index] }}" ng-repeat="data in row.data track by $index">{{ data }}</td>
				</tr>
				<tr ng-if="row.feedback != null" class="feedback single_column" ng-repeat-end>
					<td colspan="{{ row.data.length + 1 }}">
						<p>{{ row.feedback }}</p>
					</td>
				</tr>
			</tbody>
		</table>
	</section>

	<div class="expired container general" ng-show="expired">
		<section class="page score_expired">
			<h2 class="logo">The preview score for this widget has expired.</h2>
			<a class="action_button" href="{{ widget.href }}">Preview Again</a>
		</section>
	</div>

	<div class="score_restrict container general" ng-show="restricted">
		<section class="page score_restrict">
			<h2 class="logo">You don't have permission to view this page.</h2>

			<p>You may need to:</p>
			<ul>
				<li>Make sure the score you're trying to access belongs to you or your student.</li>
				<li>Try to access this score through your profile page.</li>
				<li>Check out our documentation.</li>
			</ul>

			<?= Theme::instance()->view('partials/help/support_info') ?>
		</section>
	</div>
</article>
