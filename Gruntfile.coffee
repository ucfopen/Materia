module.exports = (grunt) ->

	# just in-time loader to replace loadNpmTasks
	require('jit-grunt')(grunt)

	coffeeSrc = 'src/coffee'
	sassSrc   = 'src/sass'

	grunt.initConfig

		coffee:
			options:
				join: true

			dashboard:
				files:
					'public/themes/default/assets/js/dashboard.js': [
						coffeeSrc+'/app.coffee'
					]

			# Student view
			student:
				files:
					'public/themes/default/assets/js/student.js': [
						coffeeSrc+'/services/srv-user.coffee',
						coffeeSrc+'/services/srv-api.coffee',
						coffeeSrc+'/services/srv-datetime.coffee',
						coffeeSrc+'/controllers/ctrl-page.coffee',
						coffeeSrc+'/controllers/ctrl-current-user.coffee',
						coffeeSrc+'/controllers/ctrl-notification.coffee',
						coffeeSrc+'/controllers/ctrl-login.coffee',
						coffeeSrc+'/controllers/ctrl-profile.coffee',
						coffeeSrc+'/controllers/ctrl-scores.coffee',
						coffeeSrc+'/controllers/ctrl-settings.coffee',
						coffeeSrc+'/controllers/ctrl-help.coffee',
						coffeeSrc+'/directives/*',
					]

			# Author view
			author:
				files:
					'public/themes/default/assets/js/author.js': [
						coffeeSrc+'/filters/*',
						coffeeSrc+'/services/*',
						coffeeSrc+'/controllers/ctrl-page.coffee',
						coffeeSrc+'/controllers/ctrl-current-user.coffee',
						coffeeSrc+'/controllers/ctrl-notification.coffee',
						coffeeSrc+'/controllers/ctrl-create.coffee',
						coffeeSrc+'/controllers/ctrl-lti.coffee',
						coffeeSrc+'/controllers/ctrl-media-import.coffee',
						coffeeSrc+'/controllers/ctrl-question-import.coffee',
						coffeeSrc+'/controllers/ctrl-spotlight.coffee',
						coffeeSrc+'/controllers/ctrl-widget-catalog.coffee',
						coffeeSrc+'/controllers/ctrl-widget-details.coffee',
						coffeeSrc+'/controllers/ctrl-selectedwidget.coffee',
						coffeeSrc+'/controllers/ctrl-widget-settings.coffee',
						coffeeSrc+'/controllers/ctrl-export-scores.coffee',
						coffeeSrc+'/controllers/ctrl-collaboration.coffee',
						coffeeSrc+'/controllers/ctrl-sidebar.coffee',
						coffeeSrc+'/controllers/ctrl-login.coffee',
						coffeeSrc+'/directives/*',
					]

			# Materia APIs
			materia:
				files:
					'public/themes/default/assets/js/materia.js': [
						coffeeSrc+'/materia/materia.namespace.coffee',
						coffeeSrc+'/materia/*.coffee'
					]

			all_js:
				expand: true,
				flatten: true,
				cwd: coffeeSrc+'/materia/',
				src: ['*'],
				dest: 'static/js/',
				rename: (dest, src) ->
					folder = src.substring(0, src.lastIndexOf('/'))
					filename = src.substring(src.lastIndexOf('/'), src.length)
					filename = filename.substring(0, filename.lastIndexOf('.'))
					return "#{dest}#{folder}#{filename}.js"

			styleguide:
				files:
					'public/themes/default/assets/js/style-guide.js': [coffeeSrc+'/style-guide.coffee']

		sass:
			compile:
				options:
					style: 'expanded'
				files: [
					expand: true
					cwd: sassSrc
					src: ['*.scss']
					dest: 'public/themes/default/assets/css'
					ext: '.css',
				]

		watch:
			# Coffee script apps (keeping them separate will only build what needs to be built)
			coffee:
				files: [coffeeSrc+'/**/*.coffee']
				tasks: ['coffee']

			sass:
				files: [sassSrc+'/**/*']
				tasks: ['sass']

	grunt.registerTask('default', 'watch')
