module.exports = (grunt) ->

	# Directory must be specified for watching a widget.
	# When compiling this may be entered as an argument.
	widget = grunt.option('widget')
	if not widget?
		grunt.log.write("--widget option is required")

	# Directory for placing the .wigt package from a compiled widget.
	output = "source/#{widget}/_output"

	# the materiajs folder is different in sandbox mode vs production mode
	materiaJsFolder = '../../js/'
	noEmbed = ' data-embed="false"'

	materiaJsReplacements = [
		{match: /src="materia.enginecore.js"/g, replacement: 'src="'+materiaJsFolder+'materia.enginecore.js"'+noEmbed}
		{match: /src="materia.score.js"/g, replacement: 'src="'+materiaJsFolder+'materia.score.js"'+noEmbed}
		{match: /src="materia.creatorcore.js"/g, replacement: 'src="'+materiaJsFolder+'materia.creatorcore.js"'+noEmbed}
		{match: /src="materia.creatorcore.js"/g, replacement: 'src="'+materiaJsFolder+'materia.creatorcore.js"'+noEmbed}
		{match: /src="materia.storage.manager.js"/g, replacement: 'src="'+materiaJsFolder+'materia.storage.manager.js"'+noEmbed}
		{match: /src="materia.storage.table.js"/g, replacement: 'src="'+materiaJsFolder+'materia.storage.table.js"'+noEmbed}
	]

	# Tasks are organized into arrays.
	compileTasks = [
		'clean:pre'
		'copy:init'
		'coffee'
		'less'
		'sass'
		'jade'
		'autoprefixer'
		'replace:materiaJS'
	]

	# Minifies JS, CSS, HTML.
	# Embeds JS and CSS in HTML.
	# Minifies script within HTML.
	minifyTasks = [
		'uglify'
		'cssmin'
	]

	if grunt.option('minify-html') != false
		minifyTasks.push 'htmlmin', 'replace:build'

	# Embed scripts last to avoid overzealous JS/CSS whitespace stripping.
	minifyTasks.push 'embed'

	# Places prepared HTML into output folder.
	endTasks = [
		'copy:compiledAssets'
		'copy:html'
		'clean:post'
	]

	# Packages the widget and erases temp files/folders.
	packageTasks = [
		'compress'
		'compress' # BUGFIX running this twice works?!!
		'copy:package'
		'clean:package'
	]

	installTasks = [
		'exec'
	]

	if grunt.option('minify-assets') != false
		tasksToRun = compileTasks.concat minifyTasks.concat endTasks
	else
		compileTasks.push 'copy:compiledLocals'
		tasksToRun = compileTasks.concat endTasks


	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'
		widget: widget
		output: output

		# For development.
		watch:
			options:
				atBegin: true
				livereload: true
			sandbox:
				files: ["source/#{widget}/**", 'gruntfile.coffee']
				tasks: tasksToRun

		copy: 
			init:
				files: [
					# Copy non-prepocessed files
					{expand: true, cwd: "source/#{widget}/", src: ['**/*.html', '**/*.js', '**/*.css'], dest: 'temp/'}

					# Copy assets
					{expand: true, cwd: "source/#{widget}/assets", src: ['**', '!**/*.coffee', '!**/*.less', '!**/*.scss', '!**/*.jade'], dest: "#{widget}/assets"}
					{expand: true, cwd: "source/#{widget}/_icons", src: ['**'], dest: "#{widget}/img"}
					{expand: true, cwd: "source/#{widget}/_screen-shots", src: ['**'], dest: "#{widget}/img/screen-shots"}

					# Copy YAML
					{expand: true, cwd: "source/#{widget}/_score", src: ['**'], dest: "#{widget}/_score-modules"}
					{expand: true, cwd: "source/#{widget}/spec", src: ['**'], dest: "#{widget}/spec"}
					{expand: true, cwd: "source/#{widget}", src: ['install.yaml', 'demo.yaml'], dest: "#{widget}/"}
				]
			compiledLocals:
				files: [
					{expand: true, cwd: 'temp/', src: ['*.css', '*.js'], dest: "#{widget}/"}
				]

			compiledAssets:
				files: [
					{expand: true, cwd: 'temp/assets/', src: ['**/*.css', '**/*.js'], dest: "#{widget}/assets"}
				]
			html:
				files: [
					{expand: true, cwd: 'temp', src: ['**/*.html'],  dest: widget}
				]
			package:
				files: [{
					expand: true
					cwd: "#{output}/"
					src: ['*.zip']
					dest: "#{output}/"
					rename: (dest, src) ->
						dest + src.replace '.zip', '.wigt'
				}]

		# Compilation.
		coffee:
			engine:
				expand: true
				cwd: "source/#{widget}/"
				src: '*.coffee'
				dest: 'temp/'
				rename: (dest, src) -> "#{dest}/#{src.replace(/\.coffee$/, '.js')}"
			assets:
				expand: true
				cwd: "source/#{widget}/assets"
				src: '**/*.coffee'
				dest: 'temp/assets/'
				rename: (dest, src) -> "#{dest}/#{src.replace(/\.coffee$/, '.js')}"
		less:
			engine:
				files: [{expand:true, cwd:"source/#{widget}/", src:['**/*.less'], dest: 'temp/', ext:'.css'}]
			assets:
				files: [{expand:true, cwd:"source/#{widget}/assets/", src:['**/*.less'], dest: 'temp/assets/', ext:'.css'}]
		sass:
			engine:
				files: [{expand:true, cwd:"source/#{widget}/", src:['**/*.scss'], dest: 'temp/', ext:'.css'}]
			assets:
				files: [{expand:true, cwd:"source/#{widget}/assets/", src:['**/*.scss'], dest: 'temp/assets/', ext:'.css'}]
		jade:
			engine:
				files: [{expand:true, cwd:"source/#{widget}/", src:['**/*.jade'], dest: 'temp/', ext:'.html'}]
			assets:
				files: [{expand:true, cwd:"source/#{widget}/assets/", src:['**/*.jade'], dest: 'temp/assets/', ext:'.html'}]
		autoprefixer:
			engine:
				src: 'temp/player.css'
				dest: 'temp/player.css'
			creator:
				src: 'temp/creator.css'
				dest: 'temp/creator.css'

		# Minification.
		uglify:
			options:
				mangle:
					except: [
						'jQuery'
						'Backbone'
						'angular'
						# Enter any variables to preserve
					]
				preserveComments: false
			build:
				files: [{expand:true, cwd:"temp/", src:['*.js', '!*.min.js', '!*.pack.js'], dest: 'temp/', ext:'.js'}]
		cssmin:
			build:
				files: [{expand:true, cwd:"temp/", src:['*.css'], dest: 'temp/', ext:'.css'}]
		embed:
			options:
				threshold: '1000KB'
			player:
				files:
					'temp/player.html': 'temp/player.html'
			creator:
				files:
					'temp/creator.html': 'temp/creator.html'
		htmlmin:
			options:
				removeComments    : true
			build:
				files:
					'temp/player.html': 'temp/player.html'
					'temp/creator.html': 'temp/creator.html'
		replace:
			build:
				files: [
					{expand: true, src: ['temp/*.html'], dest: ''}
				]
				options:
					patterns: [
						{match: /\n\t/g, replacement: ''}
						{match: /\s{2,}/g, replacement: ' '}
					]
			materiaJS:
				files: [
					{expand: true, src: ['temp/*.html'], dest: ''}
				]
				options:
					patterns: materiaJsReplacements
			
		# Packaging.
		compress:
			build:
				options:
					archive: "#{output}/#{widget}.zip"
					mode: 'zip'
					pretty:true
				files: [
					{expand:true, cwd: "#{widget}", src:['**/**']}
				]

		# Cleanup.
		clean:
			pre: ["#{widget}/"]
			post: ['temp/']
			package:
				src: ["#{output}/#{widget}.zip"]
				options:
					force: true

		exec:
			install:
				cmd: "php oil r widget:install static/sandbox/source/#{widget}/_output/#{widget}.wigt -f -u"
				cwd: "../../"

	# Load Grunt Plugins.
	require('load-grunt-tasks')(grunt)

	# Show General Documentation.
	grunt.registerTask 'default', -> showDocs()

	# Prepare a basic widget.
	grunt.registerTask 'scaffold', ->
		grunt.config.set 'widget', arguments[0]

		# TODO: ADD THIS TASK

	grunt.registerTask 'sandbox', ->
		grunt.task.run tasksToRun

	grunt.registerTask 'package', ->
		grunt.log.writeln "output: #{output}"
		grunt.task.run tasksToRun.concat packageTasks

	grunt.registerTask 'install', ->
		grunt.log.writeln "output: #{output}"
		tasksToRun = tasksToRun.concat packageTasks.concat installTasks
		grunt.task.run tasksToRun

	showDocs = ->
		grunt.log.writeln '''
			Mako Grunt helps you develop and package HTML widgets for the Materia Platform.
			Place your development widget in static/widget/sandbox/source/myWidget

			Usage:
				grunt sandbox                  Builds widget for Materia Platform Sandbox.
				grunt watch                    Watches source files for changes and automatically runs sandbox.
				grunt package                  Builds and packages widget for instillation into Materia.
				grunt install                  Installs the widget into Materia for testing scoring and creating 

			Required:
				--widget=widgetdir             Widget name (matching directory inside static/widget/sandbox/source).

			Options:
				--minify-assets=[true|false]   Minify mode compresses images, html, js, and css. Default is true.
				--minify-html=[true|false]     Minify HTML code by ruthlessly removing space

			Example:
				grunt --widget=flashcards --minify-assets=false watch
		'''
