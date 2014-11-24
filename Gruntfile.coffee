module.exports = (grunt) ->

	# load all grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

	srcDir = 'src/' # Base Source dir for coffeescript

	grunt.initConfig

		coffee:
			options:
				join: true

			dashboard:
				files:
					'public/themes/default/assets/js/dashboard.js': [
						srcDir+'coffee/app.coffee'
					]

			# Student view
			student:
				files:
					'public/themes/default/assets/js/student.js': [
						srcDir+'coffee/controllers/ctrl-page.coffee',
						srcDir+'coffee/controllers/ctrl-notification.coffee',
						srcDir+'coffee/controllers/ctrl-login.coffee',
						srcDir+'coffee/controllers/ctrl-profile.coffee',
						srcDir+'coffee/controllers/ctrl-scores.coffee',
						srcDir+'coffee/controllers/ctrl-settings.coffee',
						srcDir+'coffee/controllers/ctrl-help.coffee',
						srcDir+'coffee/directives/*',
					]

			# Author view
			author:
				files:
					'public/themes/default/assets/js/author.js': [
						srcDir+'coffee/controllers/ctrl-page.coffee',
						srcDir+'coffee/controllers/ctrl-notification.coffee',
						srcDir+'coffee/controllers/ctrl-create.coffee',
						srcDir+'coffee/controllers/ctrl-lti.coffee',
						srcDir+'coffee/controllers/ctrl-media-import.coffee',
						srcDir+'coffee/controllers/ctrl-question-import.coffee',
						srcDir+'coffee/controllers/ctrl-my-widgets.coffee',
						srcDir+'coffee/controllers/ctrl-spotlight.coffee',
						srcDir+'coffee/controllers/ctrl-widget-catalog.coffee',
						srcDir+'coffee/controllers/ctrl-widget-details.coffee',
						srcDir+'coffee/directives/*',
					]

			# Materia APIs
			materia:
				files:
					'public/themes/default/assets/js/materia.js': [
						srcDir+'coffee/materia/materia.namespace.coffee',
						srcDir+'coffee/materia/*.coffee'
					]

			all_js:
				expand: true,
				flatten: true,
				cwd: srcDir+"coffee/materia/",
				src: ['*'],
				dest: 'static/js/',
				rename: (dest, src) ->
					folder = src.substring(0, src.lastIndexOf('/'))
					filename = src.substring(src.lastIndexOf('/'), src.length)
					filename = filename.substring(0, filename.lastIndexOf('.'))
					return "#{dest}#{folder}#{filename}.js"

			styleguide:
				files:
					'public/themes/default/assets/js/style-guide.js': [srcDir+'coffee/style-guide.coffee']

		sass:
			compile:
				options:
					style: 'expanded'
				files: [
					expand: true
					cwd: srcDir+'sass/'
					src: ['*.scss']
					dest: 'public/themes/default/assets/css'
					ext: '.css',
				]

		watch:
			# Coffee script apps (keeping them separate will only build what needs to be built)
			coffee:
				files: [srcDir+'coffee/**/*.coffee']
				tasks: ['coffee']

			sass:
				files: [srcDir+'sass/**/*']
				tasks: ['sass']

	grunt.registerTask('default', 'watch')
