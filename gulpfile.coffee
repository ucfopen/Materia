gulp          = require 'gulp'
coffee        = require 'gulp-coffee'
watch         = require 'gulp-watch'
sass          = require 'gulp-sass'
concat        = require 'gulp-concat'
uglify        = require 'gulp-uglify' # minify and mangle js
minifyCss     = require 'gulp-minify-css'
livereload    = require 'gulp-livereload' # reload the browser when files change
ngAnnotate    = require 'gulp-ng-annotate' # protect angular dependency injection from minify

path =
	js:     './src/coffee/'
	jsOut:  './public/themes/default/assets/js/'
	css:    './src/sass/'
	cssOut: './public/themes/default/assets/css/'

# all of these will be prepended with path.js
coffeeScripts =
	# array of files to be buildt into dashboard.js
	'student' : [
		'services/srv-user.coffee',
		'services/srv-api.coffee',
		'services/srv-datetime.coffee',
		'controllers/ctrl-page.coffee',
		'controllers/ctrl-current-user.coffee',
		'controllers/ctrl-notification.coffee',
		'controllers/ctrl-login.coffee',
		'controllers/ctrl-profile.coffee',
		'controllers/ctrl-scores.coffee',
		'controllers/ctrl-settings.coffee',
		'controllers/ctrl-help.coffee',
		'directives/*'
	]
	# array of files to be buildt into viewer.js
	'author': [
		'filters/*',
		'services/*',
		'controllers/ctrl-page.coffee',
		'controllers/ctrl-current-user.coffee',
		'controllers/ctrl-notification.coffee',
		'controllers/ctrl-create.coffee',
		'controllers/ctrl-lti.coffee',
		'controllers/ctrl-media-import.coffee',
		'controllers/ctrl-question-import.coffee',
		'controllers/ctrl-spotlight.coffee',
		'controllers/ctrl-widget-catalog.coffee',
		'controllers/ctrl-widget-details.coffee',
		'controllers/ctrl-selectedwidget.coffee',
		'controllers/ctrl-widget-settings.coffee',
		'controllers/ctrl-export-scores.coffee',
		'controllers/ctrl-collaboration.coffee',
		'controllers/ctrl-sidebar.coffee',
		'controllers/ctrl-login.coffee',
		'directives/*',
	]

	'materia': [
		'materia/materia.namespace.coffee',
		'materia/*.coffee'
	]

# prepend the files above with a full path
for name, files of coffeeScripts
	coffeeScripts[name] = (path.js+file for file in files) # prepend with the path.js value


processScripts = (outputScript) ->
	gulp.src coffeeScripts[outputScript]
		.pipe coffee()
		.pipe concat "#{outputScript}.min.js"
		.pipe ngAnnotate()
		.pipe uglify()
		.pipe gulp.dest(path.jsOut)

gulp.task 'watch', ->
	gulp.watch coffeeScripts.student, ['scripts-student']
	gulp.watch coffeeScripts.author, ['scripts-author']
	gulp.watch coffeeScripts.materia, ['scripts-materia']
	gulp.watch "#{path.css}**/*.scss", ['css']

gulp.task 'scripts', ->
	processScripts 'author'
	processScripts 'student'
	processScripts 'materia'

gulp.task 'scripts-student', -> processScripts 'student'
gulp.task 'scripts-author', -> processScripts 'author'
gulp.task 'scripts-materia', -> processScripts 'materia'

gulp.task 'css', ->
	gulp.src "#{path.css}*.scss"
		.pipe sass()
		.pipe minifyCss()
		.pipe gulp.dest(path.cssOut)

gulp.task 'default', ['scripts', 'css', 'watch']
