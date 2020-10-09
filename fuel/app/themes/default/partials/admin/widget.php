<div ng-controller="AdminWidgetController">
	<div class="container" id="upload_area">
		<section class="page">
			<?php if ($msg = Session::get_flash('upload_notice')): ?>
				<div class="error">
					<p><?= $msg ?></p>
				</div>
			<?php endif ?>
			<div class="top">
				<h1>Install Widget</h1>
			</div>
			<?php if ($upload_enabled): ?>
				<p>
					Upload a <strong>.wigt</strong> widget package file to install a new widget or upgrade an existing widget on Materia.
				</p>
				<form enctype="multipart/form-data" method="POST" action="/admin/upload">
					<input class="uploader" id="widget_uploader" type="file" name="file" onchange="form.submit()" <?= $upload_enabled ? '' : 'disabled' ?>/>
					<label for="widget_uploader">Upload .wigt</label>
					<span>{{ selectedFileName }}</span>
				</form>
				<p>Browse installable widgets on <a href="https://ucfopen.github.io/materia-widget-gallery/" target="_blank" rel="noopener noreferrer">The Official Materia Widget Gallery</a></p>
				<p>Browse features and more on <a href="https://ucfopen.github.io/Materia-Docs/" target="_blank" rel="noopener noreferrer">The Official Materia Documentation Page</a></p>
			<?php else: ?>
				<p>Widget uploader is <em>disabled</em>.</p>
				<p>To enable, alter the "enable_admin_uploader" configuration option in config/materia.php.</p>
				<?php if ($heroku_warning): ?>
				<p>
					<b>Note:</b> On Heroku, installing widgets must happen during the Heroku build process. Read more at
					<a href="https://ucfopen.github.io/Materia-Docs/admin/heroku.html#installing-widgets"
						target="_blank"
						rel="noopener noreferrer">
						The Official Materia Documentation Page.
					</a>
				</p>
				<?php endif; ?>
			<?php endif ?>
		</section>
	</div>
	<div class="container" id="widgets_area">
		<section class="page">
			<div class="top">
				<h1>Widget List</h1>
			</div>
			<ul>
				<li ng-repeat="widget in widgets">
					<div class="clickable widget-title" ng-click="widget.expanded = !widget.expanded">
						<span class="img-holder">
							<img ng-src="{{widget.icon}}">
						</span>
						<span class="title">{{widget.name}}</span>
					</div>
					<div class="widget-info" ng-show="widget.expanded">
						<div class="error-holder" ng-show="widget.errorMessage">
							<div ng-repeat="error in widget.errorMessage">
								{{ error }}
							</div>
						</div>
						<div class='info-holder'>
							<div>
								<span>
									<label>ID:</label>{{ widget.id }}
								</span>
							</div>
							<div>
								<span>
									<label>Installed:</label>{{ widget.created_at * 1000 | date:yyyy-MM-dd }}
								</span>
							</div>
							<div>
								<span>
									<label>Dimensions:</label>{{ widget.width }}w x {{ widget.height }}h
								</span>
							</div>
							<div>
								<span>
									<label>Settings:</label>
								</span><!--
								--><span>
									<div>
										<label class="normal">
											<input type="checkbox" ng-model="widget.in_catalog" ng-true-value='"1"' ng-false-value='"0"'/>
											In Catalog
										</label>
									</div>
									<div>
										<label class="normal">
											<input type="checkbox" ng-model="widget.is_editable" ng-true-value='"1"' ng-false-value='"0"'/>
											Is Editable
										</label>
									</div>
									<div>
										<label class="normal">
											<input type="checkbox" ng-model="widget.is_playable" ng-true-value='"1"' ng-false-value='"0"'/>
											Is Playable
										</label>
									</div>
									<div>
										<label class="normal">
											<input type="checkbox" ng-model="widget.is_scorable" ng-true-value='"1"' ng-false-value='"0"'/>
											Is Scorable
										</label>
									</div>
									<div>
										<label class="normal">
											<input type="checkbox" ng-model="widget.restrict_publish" ng-true-value='"1"' ng-false-value='"0"'/>
											Restrict Publish
										</label>
									</div>
								</span>
							</div>
							<div>
								<span>
									<label>Demo:</label><input type="text" ng-model="widget.meta_data.demo" />
								</span>
							</div>
							<div>
								<span class="long">
									<label>About:</label><textarea ng-model="widget.meta_data.about"></textarea>
								</span>
							</div>
							<div>
								<span class="long">
									<label>Excerpt:</label><textarea ng-model="widget.meta_data.excerpt"></textarea>
								</span>
							</div>
							<div>
								<span>
									<label>Features:</label>
								</span>
								<span>
									<ul>
										<li ng-repeat="feature in widget.meta_data.features">{{ feature }}</li>
									</ul>
								</span>
							</div>
							<div>
								<span>
									<label>
										Question Types:
									</label>
								</span>
								<span>
									<ul>
										<li ng-repeat="qtype in widget.meta_data.supported_data">{{ qtype }}</li>
									</ul>
								</span>
							</div>
							<div>
								<span>
									<label>
										Export Options:
									</label>
								</span>
								<span>
									<ul>
										<li ng-repeat="export in widget.meta_data.playdata_exporters">{{ export }}</li>
									</ul>
								</span>
							</div>
							<button class="action_button" ng-click="save(widget)">Save Changes</button>
						</div>
					</div>
				</li>
			</ul>
		</section>
	</div>
</div>
