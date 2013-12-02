module.exports = (grunt) ->

	# Directory must be specified for watching a widget.
	# When compiling this may be entered as an argument.
	widget = 'hangman'

	# Directory for placing the .wigt package from a compiled widget.
	# May be entered as an arugment.
	output = '<%= widget %>/output'

	# Tasks are organized into arrays.
	# Preproccessors shold be included or commented out
	# depending on workflow preferences.
	compileTasks = [
		'clean:pre'
		'copy:init'
		'coffee:creator'
		'coffee:engine'
		# 'less:creator'
		# 'less:engine'
		# 'sass:creator'
		# 'sass:engine'
		'stylus:creator'
		'stylus:engine'
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
		'copy:package'
		'clean:package'
	]

	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'
		widget: widget
		output: output

		# For development.
		watch:
			options:
				livereload: true
			compress:
				files: ['source/<%= widget %>/**', 'gruntfile.coffee']
				tasks: compileTasks.concat minifyTasks.concat endTasks
			nocompress:
				files: ['source/<%= widget %>/**', 'gruntfile.coffee']
				tasks: compileTasks.concat nonMinifyTasks.concat endTasks

		copy: 
			init:
				files: [
					# Copy non-prepocessed files
					{expand: true, cwd: 'source/<%= widget %>/_engine/', src: ['**/*.html, **/*.js', '**/*.css'], dest: 'temp/'}
					{expand: true, cwd: 'source/<%= widget %>/_creator/', src: ['**/*.html', '**/*.js', '**/*.css'], dest: 'temp/'}

					# Copy assets
					{expand: true, cwd: 'source/<%= widget %>/_assets', src: ['**'], dest: '<%= widget %>/_assets'}
					{expand: true, cwd: 'source/<%= widget %>/_icons', src: ['**'], dest: '<%= widget %>/img'}
					{expand: true, cwd: 'source/<%= widget %>/_screen-shots', src: ['**'], dest: '<%= widget %>/img/screen-shots'}

					# Copy YAML
					{expand: true, cwd: 'source/<%= widget %>/_score', src: ['**'], dest: '<%= widget %>/_score-modules'}
					{expand: true, cwd: 'source/<%= widget %>', src: ['install.yaml', 'demo.yaml'], dest: '<%= widget %>/'}
				]
			JS_CSS:
				files: [
					{expand: true, cwd: 'temp', src: ['*.css', '*.js'], dest: '<%= widget %>'}
				]
			html:
				files: [
					{expand: true, cwd: 'temp', src: ['widget.html'],  dest: '<%= widget %>'}
					{expand: true, cwd: 'temp', src: ['creator.html'], dest: '<%= widget %>'}
				]
			package:
				files: [{
					expand: true
					cwd: '<%= output %>/'
					src: ['*.zip']
					dest: '<%= output %>/'
					rename: (dest, src) ->
						dest + src.replace '.zip', '.wigt'
				}]

		# Compilation.
		coffee:
			engine:
				files: {'temp/widget.js': 'source/<%= widget %>/_engine/js/*.coffee'}
			creator:
				files: {'temp/creator.js': 'source/<%= widget %>/_creator/js/*.coffee'}
		less:
			engine:
				files: {'temp/widget.css': 'source/<%= widget %>/_engine/css/*.less'}
			creator:
				files: {'temp/creator.css': 'source/<%= widget %>/_creator/css/*.less'}
		sass:
			engine:
				files: {'temp/widget.css': 'source/<%= widget %>/_engine/css/*.scss'}
			creator:
				files: {'temp/creator.css': 'source/<%= widget %>/_creator/css/*.scss'}
		stylus:
			engine:
				files: {'temp/widget.css': 'source/<%= widget %>/_engine/css/*.styl'}
			creator:
				files: {'temp/creator.css': 'source/<%= widget %>/_creator/css/*.styl'}
		jade:
			engine:
				files: {'temp/widget.html': 'source/<%= widget %>/_engine/*.jade'}
			creator:
				files: {'temp/creator.html': 'source/<%= widget %>/_creator/*.jade'}
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
					archive: '<%= output %>/<%= widget %>.zip'
				files: [
					{expand: true, cwd: '<%= widget %>/', src: ['**']}
				]

		# Cleanup.
		clean:
			pre: ['<%= widget %>/']
			post: ['temp/']
			package: ['<%= widget %>/output/<%= widget %>.zip']

	# Load Grunt Plugins.
	require('load-grunt-tasks')(grunt)

	# Show General Documentation.
	grunt.registerTask 'default', () -> showDocs()

	# Make a widget.
	grunt.registerTask 'scaffold', () ->
		grunt.config.set 'widget', arguments[0]

		# TODO: ADD THIS TASK

	grunt.registerTask 'compile', () ->
		# Get arguments
		tasks = checkArgs arguments

		if tasks.compile
			# The first argument will be the widget name
			grunt.config.set 'widget', arguments[0]

			# Compiling is always run if parameters are correct
			grunt.task.run compileTasks
		else return grunt.log.writeln 'Enter a widget title.'

		if tasks.compress
			grunt.task.run minifyTasks
		else 
			grunt.task.run nonMinifyTasks
		grunt.task.run endTasks
		_packageWidget arguments

	_packageWidget = (args) ->
		if args[1]? and args[1] isnt 'compress' and args[1] isnt 'nocompress'
			grunt.config.set 'output', args[1]
		else if args[2]?
			grunt.config.set 'output', args[2]
		else
			grunt.config.set 'output', '<%= widget %>/output'

		grunt.log.writeln 'output' + grunt.config.get 'output'

		grunt.task.run packageTasks

	checkArgs = (args) ->
		# We cannot compile without a widget specified
		if not args[0]?
			grunt.log.error 'You must specify a widget name as your first argument.'
			return false

		minify = if args[1]? and args[1] is 'nocompress' then false else true

		return {compile: true, compress: minify}

	showDocs = () ->
		grunt.log.writeln '''
			Mako Grunt Version 0.1.0
			Mako Grunt helps you develop and package HTML widgets for the Materia Platform.



			Usage:
				grunt scaffold:<widget>:[minify]          Creates a scaffold of a development widget.
				grunt watch:<widget>:[minify]             Builds a widget for Materia Platform Sandbox.
				grunt compile:<widget>:[minify]:<output>  Builds a widget for instillation into Materia.

			Options:
				<widget>   Widget directory name if compiling/watching or desired name if scaffolding.
				[minify]   Set to 'compress' or 'nocompress'. Default is 'compress'.
				<output>   Output file path.
		'''

