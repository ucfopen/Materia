module.exports = (grunt) ->

	# just in-time loader to replace loadNpmTasks
	require('jit-grunt')(grunt)

	grunt.initConfig
		coffee:
			static:
				expand: true
				flatten: true
				cwd: 'static/coffee'
				src: ['*']
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
				files: ['static/coffee/*']
				tasks: ['coffee:static', 'uglify:static']
				options:
					spawn: false
					debounceDelay: 500

	grunt.registerTask 'default', 'watch'