module.exports = (grunt) ->

	# load all grunt tasks
	require('matchdep')
		.filterDev('grunt-*')
		.forEach(grunt.loadNpmTasks)

	grunt.initConfig
		coffee:
			static:
				expand: true
				flatten: false
				cwd: 'static/coffee'
				src: ['*.coffee','*/**/*.coffee']
				dest: 'static/js/'
				rename: (dest, src) ->
					folder = src.substring(0, src.lastIndexOf('/'))
					filename = src.substring(src.lastIndexOf('/'), src.length)
					filename = filename.substring(0, filename.lastIndexOf('.'))
					return "#{dest}#{folder}#{filename}.js"

		uglify:
			static:
				files: [
						expand: true,
						cwd: 'static/js',
						src: '**/*.js',
						dest: 'static/js'
				]

		watch:
			coffee:
				files: ['static/coffee/**/*.coffee']
				tasks: ['coffee:static']
				options:
					spawn: false
					debounceDelay: 500

	grunt.registerTask 'default', 'watch'