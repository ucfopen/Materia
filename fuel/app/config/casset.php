<?php
return [

	'paths' => [
		'gfonts' => [
			'path' => 'https://fonts.googleapis.com/',
			'css_dir' => '',
		],
		'static' => [
			'path' => Config::get('materia.urls.static'),
			'js_dir' => 'js/',
		],
		'cdnjs' => [
			'combine' => false,
			'min' => false,
			'path' => 'https://cdnjs.cloudflare.com/ajax/libs/',
			'js_dir' => '',
		],
	],

	'groups' => [

		'js' => [
			'modernizr' => [
				'files' => ['cdnjs::modernizr/2.6.2/modernizr.min.js'],
				'enabled' => true,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'modernizr'],
			],
			'jquery' => [
				'files' => ['cdnjs::jquery/1.8.1/jquery.min.js'],
				'enabled' => true,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'jquery'],
			],
			'angular' => [
				'files' => ['cdnjs::angular.js/1.2.20/angular.min.js'],
				'enabled' => true,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'angular'],
			],
			'ngModal' => [
				'files' => ['lib/bower/ngModal/dist/ng-modal.min.js'],
				'enabled' => true,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'ngModal'],
			],
			'underscore' => [
				'files' => ['cdnjs::underscore.js/1.5.2/underscore-min.js'],
				'enabled' => false,
				'combine' => false,
				'min' => false,
				'attr' => ['TT-src' => 'underscore'],
			],
			'labjs' => [
				'files' => ['cdnjs::labjs/2.0.3/LAB.min.js'],
				'enabled' => true,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'jquery'],
			],
			'swfobject' => [
				'files' => ['cdnjs::swfobject/2.2/swfobject.js'],
				'enabled' => false,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'swfobject'],
			],
			'dataTables' => [
				'files' => ['cdnjs::datatables/1.10.0/jquery.dataTables.min.js'],
				'enabled' => false,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'datatables'],
			],
			'datejs' => [
				'files' => ['cdnjs::datejs/1.0/date.min.js'],
				'enabled' => false,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'datejs'],
			],
			'fancybox' => [
				'files' => ['lib/jquery.fancybox-1.3.4.pack.js'],
				'enabled' => false,
				'attr' => ['data-src' => 'fancybox'],
			],
			'core' => [
				'files' => ['static::materia.page.default.js',],
				'enabled' => true,
				'attr' => ['data-src' => 'core'],
			],
			'help' => [
				'files' => [
					'static::materia.flashcheck.js',
					'static::materia.page.help.js',
				],
				'deps' => ['swfobject'],
				'enabled' => false,
				'attr' => ['data-src' => 'help'],
			],
			'notifications' => [
				'files' => ['static::materia.notification.js'],
				'enabled' => true,
				'combine' => false,
				'min' => false,
				'attr' => ['data-src' => 'notifications'],
			],
			'homepage' => [
				'files' => [
					'static::materia.page.notification.js',
					'static::materia.coms.json.js',
					'static::materia.permissions.user.js',
					'static::materia.permissions.widget.js',
					'cdnjs::jqueryui/1.10.4/jquery-ui.min.js',
					'static::materia.store.spotlight.js',
					'static::materia.store.slideshow.js',
				],
				'enabled' => false,
				'attr' => ['data-src' => 'homepage'],
			],
			'protected' => [
				'files' => [],
				'min' => false,
				'combine' => false,
			],
			'media_catalog' => [
				'files' => [
					'static::materia.page.media-import.js',
					'static::materia.coms.json.js',
					'lib/jquery.plupload.queue.js',
					'lib/plupload.js',
					'lib/plupload.flash.js',
					'lib/plupload.html5.js',
					'lib/plupload.html4.js',
				],
				'deps' => ['dataTables'],
				'enabled' => false,
				'attr' => ['data-src' => 'media_catalog'],
			],
			'question_catalog' => [
				'files' => [
					'static::materia.questionimporter.js',
					'static::materia.coms.json.js',
				],
				'deps' => ['dataTables'],
				'enabled' => false,
				'attr' => ['data-src' => 'question_catalog'],
			],
			'scores' => [
				'files' => [
					'static::materia.coms.json.js',
					'static::materia.scores.js',
					'static::materia.scores.scoregraphics.js',
				],
				'enabled' => false,
				'attr' => ['data-src' => 'scores'],
			],
			'embed_scores' => [
				'files' => [
					'static::materia.coms.json.js',
					'static::materia.scores.js',
					'static::materia.scores.scoregraphics.js',
				],
				'enabled' => false,
				'attr' => ['data-src' => 'embed_scores'],
			],
			'login' => [
				'files' => [
					'lib/jquery.infieldlabel.js',
					'static::materia.set.availability.js',
					'static::materia.set.datetime.js',
					'static::materia.page.login.js'
				],
				'enabled' => false,
				'attr' => ['data-src' => 'login'],
			],
			'settings' => [
				'files' => [
					'static::materia.page.settings.js',
					'lib/spin.js',
					'lib/spin.jquery.js',
					'static::materia.set.throbber.js',
				],
				'enabled' => false,
				'attr' => ['data-src' => 'settings'],
			],
			'profile' => [
				'files' => [
					'static::materia.profile.activity.load.js',
					'static::materia.page.profile.js',
					'static::materia.coms.json.js',
					'static::materia.set.datetime.js',
				],
				'deps' => ['datejs'],
				'enabled' => false,
				'attr' => ['data-src' => 'profile'],
			],
			'widget_catalog' => [
				'files' => [
					'static::materia.page.catalog.js',
					'static::materia.permissions.user.js',
					'static::materia.permissions.widget.js',
					'static::materia.page.notification.js',
					'static::materia.coms.json.js',
					'static::materia.widget.catalog.js',
					'static::materia.sorter.filter.js',
					'static::materia.set.throbber.js',
					'lib/spin.js',
					'lib/spin.jquery.js',
					'static::materia.image.js',
					'lib/sorted.js',
				],
				'enabled' => false,
				'attr' => ['data-src' => 'widget_catalog'],
			],
			'widget_detail' => [
				'files' => [
					'static::materia.image.js',
					'static::materia.coms.json.js',
					'static::materia.widget.detail.js',
					'static::materia.page.widget-detail.js'
				],
				'deps' => ['fancybox'],
				'enabled' => false,
				'attr' => ['data-src' => 'widget_detail'],
			],
			'widget_editor' => [
				'files' => [
					'static::materia.set.throbber.js',
					'lib/tablock.js',
					'lib/jquery-ui-1.8.21.custom.min.js',
					'lib/spin.js',
					'lib/spin.jquery.js',
					'static::materia.coms.json.js',
					'static::materia.creator.js',
				],
				'deps' => ['underscore', 'swfobject'],
				'enabled' => false,
				'attr' => ['data-src' => 'widget_editor'],
			],
			'my_widgets' => [
				'files' => [
					'cdnjs::angular.js/1.2.20/angular.min.js',
					'static::materia.set.datetime.js',
					'static::materia.validate.textfield.js',
					'static::materia.permissions.user.js',
					'static::materia.permissions.widget.js',
					'static::materia.page.notification.js',
					'static::materia.image.js',
					'lib/tablock.js',
					'static::materia.set.throbber.js',
					'lib/spin.js',
					'lib/spin.jquery.js',
					'static::materia.coms.json.js',
					'cdnjs::jqueryui/1.10.4/jquery-ui.min.js',
					'lib/jquery-ui-timepicker-addon.js',
					'static::materia.mywidgets.app.js',
					'static::routes/route-mywidgets.js',
					'static::services/srv-user.js',
					'static::services/srv-selectedWidget.js',
					'static::services/srv-widget.js',
					'static::directives/dir-sidebarselection.js',
					'static::directives/dir-scoregraph.js',
					'static::directives/dir-scoretable.js',
					'static::directives/dir-scoredata.js',
					'static::materia.user.js',
					'static::materia.widgetinstance.js',
					'static::materia.mywidgets.availability.js',
					'static::materia.mywidgets.selectedwidget.js',
					'static::materia.mywidgets.sidebar.js',
					'static::materia.mywidgets.statistics.js',
					'static::materia.mywidgets.tasks.js',
					'static::materia.mywidgets.csv.js',
					'static::materia.set.availability.js',
					'lib/jquery.jqplot.min.js',
					'lib/jqplot_plugins/jqplot.barRenderer.min.js',
					'lib/jqplot_plugins/jqplot.canvasTextRenderer.min.js',
					'lib/jqplot_plugins/jqplot.canvasAxisTickRenderer.min.js',
					'lib/jqplot_plugins/jqplot.categoryAxisRenderer.min.js',
					'lib/jqplot_plugins/jqplot.cursor.min.js',
					'lib/jqplot_plugins/jqplot.highlighter.min.js',
					'lib/md5.js'
				],
				'deps' => ['dataTables', 'datejs', 'angular', 'ngModal'],
				'enabled' => false,
				'attr' => ['data-src' => 'my_widgets'],
			],
			'widget_play' => [
				'files' => [
					'lib/tablock.js',
					'lib/jquery-ui-1.8.21.custom.min.js',
					'static::materia.coms.json.js',
					'static::materia.player.js'
				],
				'deps' => ['swfobject'],
				'enabled' => false,
				'attr' => ['data-src' => 'widget_play'],
			],
		],

		'css' => [
			'upload' => [
				'files' => ['upload.css'],
				'enabled' => false,
			],
			'widget_play' => [
				'files' => ['play.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'widget_play'],
			],
			'my_widgets' => [
				'files' => [
					'my_widgets.css',
					'jquery.jqplot.min.css',
					'ui-lightness/jquery-ui-1.8.21.custom.css',
					'ui-lightness/jquery-ui-timepicker-addon.css',
					'../js/lib/bower/ngModal/dist/ng-modal.css',
					'jquery.dataTables.css'
				],
				'enabled' => false,
				'attr' => ['data-src' => 'my_widgets'],
			],
			'widget_editor' => [
				'files' => ['create.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'widget_editor'],
			],
			'widget_detail' => [
				'files' => ['jquery.fancybox-1.3.4.css', 'widget.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'widget_catalog'],
			],
			'widget_catalog' => [
				'files' => ['catalog.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'widget_catalog'],
			],
			'profile' => [
				'files' => ['user.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'profile'],
			],
			'login' => [
				'files' => ['login.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'login'],
			],
			'scores' => [
				'files' => ['jquery.jqplot.min.css', 'scores.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'scores'],
			],
			'embed_scores' => [
				'files' => ['jquery.jqplot.min.css', 'scores_embedded.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'embed_scores'],
			],
			'question_catalog' => [
				'files' => ['jquery.dataTables.css','question-import.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'homepage'],
			],
			'media_catalog' => [
				'files' => [
					'jquery.dataTables.css',
					'jquery.plupload.queue.css',
					'media-import.css'
				],
				'enabled' => false,
				'attr' => ['data-src' => 'homepage'],
			],
			'homepage' => [
				'files' => ['store.css','widget.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'homepage'],
			],
			'help' => [
				'files' => ['docs.css'],
				'enabled' => false,
				'attr' => ['data-src' => 'help'],
			],
			'404' => [
				'files' => ['404.css'],
				'enabled' => false,
				'attr' => ['data-src' => '404'],
			],
			'core' => [
				'files' => ['main.css'],
				'enabled' => true,
				'attr' => ['data-src' => 'core'],
			],
			'fonts' => [
				'files' => [
					'gfonts::css?family=Kameron:700&text=0123456789%25',
					'gfonts::css?family=Lato:300,400,700,700italic,900&amp;v2',
				],
				'attr' => ['data-src' => 'fonts'],
				'min' => false,
				'combine' => false,
			],
			'page' => [
				'files' => [],
				'attr' => ['data-src' => 'page'],
			],
		],
	],
];
