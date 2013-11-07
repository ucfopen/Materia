<article class="container">
	<script id="score_header_template" type="text/template">
			<h1><%= data.title %> Scores:</h1>

			<nav class="previous-attempts">
				<h1>Prev. Attempts</h1>
				<ul>
					<% for (var k=0; k < data.attempts.length; k++) { %>
						<% var attempt_num = data.attempts.length - k; %>
							<li><a href="#attempt-<%= attempt_num %>">Attempt <%= attempt_num %>: <span class="score"><%= data.attempts[k].roundedPercent %>%</span> <span class="date"><%= data.dates[k] %></span></a></li>
					<% } %>
				</ul>
			</nav>

			<nav class="play-again">
				<h1><a id="play-again" class="action_button" href="<%= data.href %>"><%= data.play_again %></a></h1>
			</nav>
	</script>
	<header class="header"></header>

	<script id="score_overview_template" type="text/template">
			<div id="overview-score">
				<hgroup>
					<h1>Attempt <span class="attempt-num"><%= data.attempt_num %></span> Score:</h1>
					<h2 class="overall_score"><%= data.score %><span class="percent">%</span></h2>
				</hgroup>
				<div id="class-rank-button" class="action_button gray" >Compare With Class</div>
			</div>

			<div id="overview-table">
				<table>
					<tbody>
						<% for (var i=0; i < data.table.length; i++) { %>
							<% var row = data.table[i]; %>
								<tr>
									<td><%= row.message %></td>
									<% var sign = (row.value > -1) ? 'positive' : 'negative' %>
									<td class="<%= sign %> number"><%= row.value %><%= (row.symbol == null) ? '%' : row.symbol %></td>
								</tr>
						<% } %>
					</tbody>
				</table>
			</div>
	</script>
	<section class="overview"></section>

	<script id="score_graph_template" type="text/template">
	</script>

	<section class="score-graph">
		<div class="graph">
			<div id="graph">
			</div>
		</div>
	</section>

	<script id="score_details_template" type="text/template">
		<% for (var i = 0; i < data.length; i++) { %>
			<% var detail = data[i]; %>
			<h1><%= detail.title %></h1>
			<ul>
				<li class="details_header">
					<% for (var j = 0; j < detail.header.length; j++) { %>
						<h3><%= detail.header[j] %></h3>
					<% } %>
				</li>
				<% for (var j = 0; j< detail.table.length; j++) { %>
					<% var row = detail.table[j]; %>
					<li class="<%= row.style %>">
						<% if (row.graphic != "none") { %>
							<div class="index">
								<canvas class="question-number" id="question-<%= i+1 %>-<%= j+1 %>" >
									<p><%= j+1 %></p>
								</canvas>
									<span>
										<% if (row.display_score) { %>
											<%= row.score %><%= row.symbol %>
										<% } %>
									</span>
							</div>
						<% } %>
						<% for (var k = 0; k < row.data.length; k++) { %>
							<<%= row.tag != null ? row.tag : 'div' %> class="<%= row.data_style[k] %>"><%= row.data[k] %></div>
						<% } %>
					</li>
					<% if (row.feedback != null) { %>
						<li class="feedback single_column">
							<p><%= row.feedback %></p>
						</li>
					<% } %>
				<% } %>
			</ul>
		<% } %>
	</script>
	<section class="details"></section>

</article>

<?= Theme::instance()->view('partials/score/expired'); ?>
<?= Theme::instance()->view('partials/score/restricted'); ?>