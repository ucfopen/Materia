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

			main:
				files:
					'public/themes/default/assets/js/main.js': [
						srcDir+'coffee/controllers/ctrl-page.coffee'
						srcDir+'coffee/materia.notification.coffee'
						srcDir+'coffee/materia.page.notification.coffee'
					]

			controllers:
				files:
					'public/themes/default/assets/js/controllers.js': [
						srcDir+'coffee/controllers/*'
					]

			materia:
				files:
					'public/themes/default/assets/js/materia.js': [
						srcDir+'coffee/materia/*.coffee'
					]

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
