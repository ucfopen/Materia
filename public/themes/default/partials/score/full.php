<article class="container" ng-app="scorePage" ng-controller="scorePageController">
	<h1>{{ widget.title }} Scores:</h1>

	<nav class="previous-attempts">
		<h1>Prev. Attempts</h1>
		<ul>
			<li ng-repeat="attempt in data.attempts" ng-init="data.attempts.length - $index">
				<a href="#attempt-{{ attempt_num }}">Attempt {{ attempt_num }}: <span class="score">{{ attempt.roundedPercent }}%</span> <span class="date">{{ data.dates[$index] }}</span>
			</a></li>
		</ul>
	</nav>

	<nav class="play-again">
		<h1><a id="play-again" class="action_button" href="{{ data.href }}">{{ data.play_again }}</a></h1>
	</nav>
	<header class="header"></header>

	<div id="overview-score">
		<hgroup>
			<h1>Attempt <span class="attempt-num">{{ data.attempt_num }}</span> Score:</h1>
			<h2 class="overall_score">{{ data.score }}<span class="percent">%</span></h2>
		</hgroup>
		<div id="class-rank-button" class="action_button gray" >Compare With Class</div>
	</div>

	<div id="overview-table">
		<table>
			<tbody>
				<tr ng-repeat="row in data.table">
					<td>{{ row.message }}</td>
					<td class="{{ (row.value > -1) ? 'positive' : 'negative' }} number">
						{{ row.value }}{{ (row.symbol == null) ? '%' : row.symbol }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<section class="overview"></section>

	<section class="score-graph">
		<div class="graph">
			<div id="graph">
			</div>
		</div>
	</section>

	<div ng-repeat="detail in details">
		<h1><%= detail.title %></h1>
		<ul>
			<li class="details_header">
				<h3 ng-repeat="header in detail.header">
					{{ header }}
				</h3>
			</li>
			<div ng-repeat="row in detail.table">
				<li class="{{ row.style }}">
					<div class="index" ng-if="row.graphic != 'none'">
						<canvas class="question-number" id="question-{{ $parent.$index+1 }} %>-<%= $index+1 %>" >
							<p>{{ $parent.$index+1 }}</p>
						</canvas>
						<span ng-if="{{ row.display_score }}">
							{{ row.score }}{{ row.symbol }}
						</span>
					</div>
					<div class="{{ row.data_style[$index] }}" ng-repeat="data in row.data">{{ data }}</div>
				</li>
				<li ng-if="row.feedback != null" class="feedback single_column">
					<p>{{ row.feedback }}</p>
				</li>
		</ul>
	</div>
	<section class="details"></section>

</article>

<?= Theme::instance()->view('partials/score/expired'); ?>
<?= Theme::instance()->view('partials/score/restricted'); ?>
