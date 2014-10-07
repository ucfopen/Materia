<div class="container">
	<section class="page">
		<div class="top">
			<h1>Widget Catalog</h1>
		</div>
		<div class="widgets" data-container="catalog-wiget"></div>
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

<script type="text/template" id="t-widget-card"><section class="widget template" data-template="catalog-widget">
	<a href="/widgets/detail/_template_clean_name"><img src='/assets/img/default/default-icon-92.png'></a>
	<div class="header">
		<h1><a href="/widgets/detail/_template_clean_name" class="searchable">_template_name</a></h1>
	</div>
	<dl class="left inline_def blurb">
		<dt data-type="description">Description:</dt>
		<dd>_template_description</dd>
	</dl>
	<dl class="left inline_def features_list">
		<dt data-type="features">Features:</dt>
		<dd class="searchable">_template_feature</dd>
		<dt data-type="supported">Supported Data:</dt>
		<dd class="searchable">_template_supported</dd>
		<dt data-type="project">Project:</dt>
		<dd class="searchable">_template_project</dd>
	</dl>
</section></script>
