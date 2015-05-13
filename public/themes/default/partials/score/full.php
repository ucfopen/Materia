<article class="container" ng-class="{ show: show }" ng-controller="scorePageController">
	<header class="header" ng-class="{ preview: isPreview }" ng-show="!restricted && !expired">
		<h1 ng-style="headerStyle">{{ widget.title }} Scores:</h1>

		<nav class="previous-attempts {{ prevAttemptClass }}" ng-hide="hidePreviousAttempts || isPreview || guestAccess" ng-mouseover="prevMouseOver()" ng-mouseout="prevMouseOut()">
			<h1 ng-click="prevClick()">Prev. Attempts</h1>
			<ul ng-mouseover="prevMouseOver()">
				<li ng-repeat="attempt in attempts" ng-init="num = attempts.length - $index">
					<a href="#attempt-{{ num }}" ng-click="attemptClick()">Attempt {{ num }}: <span class="score">{{ attempt.roundedPercent }}%</span> <span class="date">{{ dates[$index] }}</span>
				</a></li>
			</ul>
		</nav>

		<nav class="play-again">
			<h1><a id="play-again" ng-hide="hidePlayAgain" class="action_button" href="{{ widget.href }}">{{ isPreview ? 'Preview' : 'Play' }} Again</a></h1>
		</nav>

	</header>
	<section class="overview" ng-class="{ preview: isPreview }" ng-show="!restricted && !expired">
		<div id="overview-score">
			<h1 ng-if="!guestAccess">Attempt <span class="attempt-num">{{ attempt_num }}</span> Score:</h1>
			<h1 ng-if="guestAccess">This Attempt Score:</h1>
			<span class="overall_score">{{ overview.score }}<span class="percent">%</span></span>
			<div id="class-rank-button" class="action_button gray" ng-show="showCompareWithClass" ng-click="toggleClassRankGraph()">{{ classRankText }}</div>
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


	<section class="details" ng-repeat="detail in details" ng-show="!restricted && !expired">
		<h1>{{ detail.title }}</h1>
		<ul>
			<li class="details_header">
				<h3 ng-repeat="header in detail.header">{{ header }}</h3>
			</li>
			<li class="{{ row.style }}" ng-repeat-start="row in detail.table">
				<div class="index" ng-if="row.graphic != 'none'">
					<canvas class="question-number" id="question-{{ $parent.$parent.$index+1 }}-{{ $index+1 }}" >
						<p>{{ $index+1 }}</p>
					</canvas>
					<span ng-if="row.display_score">
						{{ row.score }}{{ row.symbol }}
					</span>
				</div>
				<div class="{{ row.data_style[$index] }}" ng-repeat="data in row.data track by $index">{{ data }}</div>
			</li>
			<li ng-if="row.feedback != null" class="feedback single_column" ng-repeat-end>
				<p>{{ row.feedback }}</p>
			</li>
		</ul>
	</section>

	<section class="materia-sendoff" ng-show="isEmbedded && !restricted && !expired">
		<div>
			<h1>More information about your score can be found by <a id="visit-materia" href="{{ moreInfoLink }}" target="blank">visiting Materia</a>.</h1>
		</div>
	</section>

	<div class="expired container general" ng-show="expired">
		<section class="page score_expired">
			<h2 class="logo">The preview score for this widget has expired.</h2>
			<a class="action_button" href="{{ widget.href }}">Preview Again</a>
		</section>
	</div>

	<div class="score_restrict container general" ng-show="restricted">
		<section class="page score_restrict">
			<h2 class="logo">You don't have any scores for this widget.</h2>

			<p>You may need to:</p>
			<ul>
				<li>Make sure the score you're trying to access belongs to you.</li>
				<li>Try to access this score through your profile page.</li>
				<li>Check out our documentation.</li>
			</ul>

			<?= Theme::instance()->view('partials/help/support_info') ?>

		</section>
	</div>
</article>

