<article class="container" ng-app="scorePage" ng-controller="scorePageController">
	<header class="header">
		<h1>{{ widget.title }} Scores:</h1>

		<nav class="previous-attempts">
			<h1>Prev. Attempts</h1>
			<ul>
				<li ng-repeat="attempt in attempts" ng-init="num = attempts.length - $index">
					<a href="#attempt-{{ num }}">Attempt {{ num }}: <span class="score">{{ attempt.roundedPercent }}%</span> <span class="date">{{ data.dates[$index] }}</span>
				</a></li>
			</ul>
		</nav>

		<nav class="play-again">
			<h1><a id="play-again" class="action_button" href="{{ widget.href }}">{{ widget.play_again }}</a></h1>
		</nav>

	</header>
	<section class="overview">
		<div id="overview-score">
			<hgroup>
				<h1>Attempt <span class="attempt-num">{{ attempt_num }}</span> Score:</h1>
				<h2 class="overall_score">{{ overview.score }}<span class="percent">%</span></h2>
			</hgroup>
			<div id="class-rank-button" class="action_button gray" >Compare With Class</div>
		</div>
		<div id="overview-table">
			<table>
				<tbody>
					<tr ng-repeat="row in overview.table">
						<td>{{ row.message }}</td>
						<td class="{{ (row.value > -1) ? 'positive' : 'negative' }} number">
							{{ row.value }}{{ (row.symbol == null) ? '%' : row.symbol }}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="score-graph">
		<div class="graph">
			<div id="graph">
			</div>
		</div>
	</section>


	<section class="details" ng-repeat="detail in details">
		<h1>{{ detail.title }}</h1>
		<ul>
			<li class="details_header">
				<h3 ng-repeat="header in detail.header">{{ header }}</h3>
			</li>
			<li class="{{ row.style }}" ng-repeat-start="row in detail.table">
				<div class="index" ng-if="row.graphic != 'none'">
					<canvas class="question-number" id="question-{{ $parent.index+1 }}-{{ $index+1 }}" >
						<p>{{ $index+1 }}</p>
					</canvas>
					<span ng-if="row.display_score">
						{{ row.score }}{{ row.symbol }}
					</span>
				</div>
				<div class="{{ row.data_style[$index] }}" ng-repeat="data in row.data">{{ data }}</div>
			</li>
			<li ng-if="row.feedback != null" class="feedback single_column" ng-repeat-end>
				<p>{{ row.feedback }}</p>
			</li>
		</ul>
	</section>

</article>

<?= Theme::instance()->view('partials/score/expired'); ?>
<?= Theme::instance()->view('partials/score/restricted'); ?>
