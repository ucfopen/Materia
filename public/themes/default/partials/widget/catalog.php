<div ng-app="widgetApp" class="container">
	<section class="page">
		<div class="top">
			<h1>Widget Catalog</h1>
		</div>
		<div class="widgets" ng-controller="widgetCtrl">
			<section ng-repeat="widget in widgets" class="widget {{widget.clean_name}}" ng-mouseenter="showInfoCard(widget.id)">
				<a href="/widgets/{{widget.id}}-{{widget.clean_name}}"><img src='{{widget.icon}}'></a>
				<div class="header">
					<h1><a href="/widgets/{{widget.id}}-{{widget.clean_name}}" class="searchable">{{widget.name}}</a></h1>
				</div>
				<dl class="left inline_def blurb">
					<dt data-type="description">Description:</dt>
					<dd>{{widget.meta_data['excerpt']}}</dd>
				</dl>
				<div ng-show="infoCard[widget.id]" class="infocard" style="width: 356px; display: block; margin-top: 5px; -webkit-transition: 1s ease-in-out;" ng-mouseleave="hideInfoCard()">
					<a class="card-content" href="/widgets/{{widget.id}}-{{widget.clean_name}}" style="padding: 0">
						<a href="/widgets/{{widget.id}}-{{widget.clean_name}}"><img src='{{widget.icon}}'></a>
						<div class="header">
							<h1 style="margin: 5px auto;"><a href="/widgets/{{widget.id}}-{{widget.clean_name}}" class="searchable" style="color: #fff; text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);">{{widget.name}}</a></h1>
						</div>
						<dl class="left inline_def blurb">
							<dt data-type="description">Description:</dt>
							<dd>{{widget.meta_data['excerpt']}}</dd>
						</dl>
						<dl class="left inline_def features_list" style="display: block">
							<dt data-type="features">Features:</dt>
							<dd ng-repeat="feature in widget.meta_data['features']" class="searchable">{{feature}}</dd>
							<dt ng-show="widget.meta_data['supported_data']" data-type="supported">Supported Data:</dt>
							<dd ng-repeat="supported in widget.meta_data['supported_data']" class="searchable">{{supported}}</dd>
						</dl>
					</a>
				</div>
			</section>
		</div>
	</section>

	<aside>
		<h1>Features:</h1>
		<dl class="features">
			<dt><?= Form::checkbox($id = 'filter_collects_scores', 'Scorable') ?><?= Form::label('Widget collects scores', $id) ?></dt>
			<dd>These widgets are well suited to gauge performance.</dd>
			<dt><?= Form::checkbox($id = 'filter_tracks_student_data', 'Customizable') ?><?= Form::label('Widget is customizable', $id) ?></dt>
			<dd><p>This means you supply the widget with data to make it relevant to your course.</p>
				<h2>Supported data:</h2>
				<ul class="supported-data">
					<li><?= Form::checkbox($id = 'supported_data_qa', 'Question/Answer') ?><?= Form::label('Question/Answer', $id) ?></li>
					<li><?= Form::checkbox($id = 'supported_data_mc', 'Multiple Choice') ?><?= Form::label('Multiple Choice', $id) ?></li>
					<li><?= Form::checkbox($id = 'supported_data_media', 'Media') ?><?= Form::label('Media', $id) ?></li>
				</ul>
			</dd>
		</dl>
	</aside>
</div>

<?= Theme::instance()->view('partials/notification') ?>
