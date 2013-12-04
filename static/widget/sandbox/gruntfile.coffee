module.exports = (grunt) ->

	# Directory must be specified for watching a widget.
	# When compiling this may be entered as an argument.
	widget = grunt.option('widget')
	if not widget?
		grunt.log.write("--widget option is required")

	# Directory for placing the .wigt package from a compiled widget.
	output = "source/#{widget}/_output"

	# Tasks are organized into arrays.
	# Preproccessors shold be included or commented out
	# depending on workflow preferences.
	compileTasks = [
		'clean:pre'
		'copy:init'
		'coffee:creator'
		'coffee:engine'
		'less:creator'
		'less:engine'
		'sass:creator'
		'sass:engine'
		'jade:engine'
		'jade:creator'
		'autoprefixer'
	]

	# Minifies JS, CSS, HTML.
	# Embeds JS and CSS in HTML.
	# Minifies script within HTML.
	minifyTasks = [
		'uglify'
		'cssmin'
		'embed'
		'htmlmin'
		'replace'
	]

	# Copies JS and CSS into output folder
	# when minifying is off.
	nonMinifyTasks = [
		'copy:JS_CSS'
	]

	# Places prepared HTML into output folder.
	endTasks = [
		'copy:html'
		'clean:post'
	]

	# Packages the widget and erases temp files/folders.
	packageTasks = [
		'compress'
		'compress' # BUGFIX  running this twice works?!!
		'copy:package'
		'clean:package'
	]

	if grunt.option('minify') == true
		tasksToRun = compileTasks.concat minifyTasks.concat endTasks
	else
		tasksToRun = compileTasks.concat nonMinifyTasks.concat endTasks

	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'
		widget: widget
		output: output

		# For development.
		watch:
			options:
				livereload: true
			sandbox:
				files: ["source/#{widget}/**", 'gruntfile.coffee']
				tasks: tasksToRun

		copy: 
			init:
				files: [
					# Copy non-prepocessed files
					{expand: true, cwd: "source/#{widget}/_engine/", src: ['**/*.html', '**/*.js', '**/*.css'], dest: 'temp/'}
					{expand: true, cwd: "source/#{widget}/_creator/", src: ['**/*.html', '**/*.js', '**/*.css'], dest: 'temp/'}

					# Copy assets
					{expand: true, cwd: "source/#{widget}/_assets", src: ['**'], dest: "#{widget}/_assets"}
					{expand: true, cwd: "source/#{widget}/_icons", src: ['**'], dest: "#{widget}/img"}
					{expand: true, cwd: "source/#{widget}/_screen-shots", src: ['**'], dest: "#{widget}/img/screen-shots"}

					# Copy YAML
					{expand: true, cwd: "source/#{widget}/_score", src: ['**'], dest: "#{widget}/_score-modules"}
					{expand: true, cwd: "source/#{widget}", src: ['install.yaml', 'demo.yaml'], dest: "#{widget}/"}
				]
			JS_CSS:
				files: [
					{expand: true, cwd: 'temp', src: ['*.css', '*.js'], dest: widget}
				]
			html:
				files: [
					{expand: true, cwd: 'temp', src: ['widget.html'],  dest: widget}
					{expand: true, cwd: 'temp', src: ['creator.html'], dest: widget}
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
				files: {'temp/widget.js': "source/#{widget}/_engine/js/*.coffee"}
			creator:
				files: {'temp/creator.js': "source/#{widget}/_creator/js/*.coffee"}
		less:
			engine:
				files: {'temp/widget.css': "source/#{widget}/_engine/css/*.less"}
			creator:
				files: {'temp/creator.css': "source/#{widget}/_creator/css/*.less"}
		sass:
			engine:
				files: {'temp/widget.css': "source/#{widget}/_engine/css/*.scss"}
			creator:
				files: {'temp/creator.css': "source/#{widget}/_creator/css/*.scss"}
		jade:
			engine:
				files: {'temp/widget.html': "source/#{widget}/_engine/*.jade"}
			creator:
				files: {'temp/creator.html': "source/#{widget}/_creator/*.jade"}
		autoprefixer:
			engine:
				src: 'temp/widget.css'
				dest: 'temp/widget.css'
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
				files:
					'temp/widget.js': 'temp/widget.js'
					'temp/creator.js': 'temp/creator.js'
		cssmin:
			build:
				files:
					'temp/widget.css': 'temp/widget.css'
					'temp/creator.css': 'temp/creator.css'
		embed:
			options:
				threshold: '1000KB'
			build:
				files:
					'temp/widget.html': 'temp/widget.html'
					'temp/creator.html': 'temp/creator.html'
		htmlmin:
			options:
				removeComments    : true
				collapseWhitespace: true
			build:
				files:
					'temp/widget.html': 'temp/widget.html'
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
			package: ["#{output}/#{widget}.zip"]

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


	showDocs = ->
		grunt.log.writeln '''
			Mako Grunt Version 0.1.0
			Mako Grunt helps you develop and package HTML widgets for the Materia Platform.

			Usage:
				grunt sandbox                  Builds widget for Materia Platform Sandbox.
				grunt watch                    Watches source files for changes and automatically runs build.
				grunt package                  Builds and packages widget for instillation into Materia.

			Required:
				--widget=widgetdir             Widget name (matching directory inside static/widget/sandbox/source).

			Options:
				--minify=[true|false]          Minify mode compresses images, html, js, and css. Default is true.

			Example:
				grunt --widget=flashcards --minify=false watch
		'''