<section class="page"
	ng-show="show"
	ng-controller="WidgetCatalogDetailsController"
	ng-cloak ng-style="{'max-width': maxPageWidth}">

	<div id="breadcrumb-container">
		<div class="breadcrumb">
			<a href="/widgets">Widget Catalog</a>
		</div>
		<svg xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24">
			<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
			<path fill="none" d="M0 0h24v24H0V0z"/>
		</svg>
		<div class="breadcrumb">{{ widget.name }}</div>
	</div>

	<article class="widget_detail">
		<div class="top">
			<img ng-src="{{ widget.icon }}"
				alt=""
				class="widget_icon">
			<h1>{{ widget.name }}</h1>
			<p>{{ widget.about }}</p>
		</div>

		<p id="widget-about">{{ widget.about }}</p>

		<div class="pics">
			<button class="pic-arrow"ng-click="prevImage()">
				<svg xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24">
					<path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
					<path fill="none" d="M0 0h24v24H0V0z"/>
				</svg>
			</button>
			<button class="pic-arrow"
				ng-click="nextImage()">
				<svg xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24">
					<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
					<path fill="none" d="M0 0h24v24H0V0z"/>
				</svg>
			</button>

			<div id="pics-scroller-container">
				<div id="pics-scroller">
					<div ng-class="{playing: !showDemoCover, loading: demoLoading}"
						ng-style="{'min-height': demoHeight, width: demoWidth}">
						<img ng-src="{{widget.screenshots[0].full}}"
							ng-show="showDemoCover"
							ondragstart="return false">
						<div id="demo-cover"
							ng-class="{hidden: !showDemoCover, loading: demoLoading}"
							ng-style="{'background-image': demoScreenshot}">
							<button class="action_button green"
								ng-click="showDemoClicked()">
								<svg xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24">
									<path d="M8 5v14l11-7z"/>
									<path d="M0 0h24v24H0z"
										fill="none"/>
								</svg>
								Play a demo now!
							</button>
							<div id="demo-cover-background"></div>
						</div>
						<div id="player-container"
							ng-if="!showDemoCover">
							<section class="widget"
								ng-controller="WidgetPlayerCtrl"
								ng-class="{ preview: isPreview }">
								<header ng-if="isPreview"
									class="preview-bar">
								</header>
								<div class="center"
									ng-show="type == 'flash' || type == 'html'">
									<iframe ng-attr-src="{{ htmlPath }}"
										ng-if="type == 'html'"
										id="container"
										class="html"
										scrolling="yes"
										fullscreen-dir>
									</iframe>
									<div id="container"
										ng-if="type =='flash'">
									</div>
								</div>
								<div id="container"
									ng-if="type =='noflash'">
									<?= Theme::instance()->view('partials/noflash') ?>
								</div>
							</section>
						</div>
						<h3>{{!showDemoCover ? 'Playing ' : '' }}Demo</h3>
					</div>

					<div ng-repeat="screenshot in widget.screenshots">
						<img ng-src="{{screenshot.full}}">
						<div class="screenshot-drag-cover"></div>
						<h3>Screenshot {{$index + 1}} of {{numScreenshots}}</h3>
					</div>
				</div>
			</div>

			<div>
				<button class="demo-dot"
					ng-class="{selected: selectedImage == 0}"
					ng-click="selectImage(0)">
					Demo
				</button>
				<button class="pic-dot"
					ng-repeat="s in widget.screenshots"
					ng-class="{selected: selectedImage == $index + 1}"
					ng-click="selectImage($index + 1)">
				</button>
			</div>
		</div>

		<section class="bottom">

			<?php if ( ! \Materia\Perm_Manager::does_user_have_role(['no_author'])): ?>
			<div class="widget-action-buttons">
				<h4>Want to use it in your course?</h4>
				<p>
					<a id ="createLink"
						href='{{ widget.creatorurl }}'
						class="action_button green">
						<svg xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24">
							<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
							<path d="M0 0h24v24H0z"
								fill="none"/>
						</svg>
						Create your widget
					</a>
				</p>
			</div>
			<?php endif; ?>

			<div class="feature-list features"
				ng-show="widget.features.length">
				<span class="feature-heading">Features:</span>
				<div class="feature"
					ng-repeat="feature in widget.features">
					<div class="feature-name"
						ng-mouseover="feature.show = true"
						ng-mouseout="feature.show = false">
						{{ feature.text }}
					</div>
					<div class="feature-description"
						ng-show="feature.show">
						{{ feature.description }}
					</div>
				</div>
			</div>

			<div class="feature-list supported-data"
				ng-show='widget.supported_data.length'>
				<span class="feature-heading">Supported Data:</span>
				<div class="feature"
					ng-repeat="data in widget.supported_data">
					<div class="feature-name"
						ng-mouseover="data.show=true"
						ng-mouseout="data.show = false">
						{{ data.text }}
					</div>
					<div class="feature-description"
						ng-show="data.show">
						{{ data.description }}
					</div>
				</div>
			</div>


			<div class="feature-list guides"
				ng-if="hasPlayerGuide || hasCreatorGuide">
				<span class="feature-heading">Guides:</span>
				<div class="feature"
					ng-if="hasPlayerGuide">
					<a class="guide-link"
						ng-href="{{widget.players_guide}}">
						Player's Guide
						<svg xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24">
							<path d="M0 0h24v24H0z"
								fill="none"/>
							<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"
								fill="white"/>
						</svg>
					</a>
				</div>

				<div class="feature"
					ng-if="hasCreatorGuide">
					<a class="guide-link"
						ng-href="{{widget.creators_guide}}">
						Creator's Guide
						<svg xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24">
							<path d="M0 0h24v24H0z"
								fill="none"/>
							<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"
								fill="white"/>
						</svg>
					</a>
				</div>
			</div>

			<span id="last-updated">{{ widget.name }} was last updated on {{ widget.created }}</span>

		</section>
	</article>
</section>
