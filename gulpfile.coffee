# REQUIRE
gulp          = require 'gulp'
coffee        = require 'gulp-coffee'
watch         = require 'gulp-watch'
sass          = require 'gulp-sass'
concat        = require 'gulp-concat'
uglify        = require 'gulp-uglify' # minify and mangle js
minifyCss     = require 'gulp-minify-css'
livereload    = require 'gulp-livereload' # reload the browser when files change
ngAnnotate    = require 'gulp-ng-annotate' # protect angular dependency injection from minify

# PATHS
path =
	js:       './src/coffee/'
	jsOut:    './public/themes/default/assets/js/'
	jsStatic: './static/js/'
	css:      './src/sass/'
	cssOut:   './public/themes/default/assets/css/'

# JAVASCRIPT
coffeeScripts =

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


# DYNAMIC JS TASKS
dynamicTasks = []

# prepend the files above with a full path
for name, files of coffeeScripts
	coffeeScripts[name] = (path.js+file for file in files) # prepend with the path.js value
	dynamicTasks.push "js-#{name}"
	# closure to hold onto name's value
	do (name) ->
		console.log "dynamic task created: js-#{name}"
		gulp.task "js-#{name}", ->
			gulp.src coffeeScripts[name]
				.pipe coffee()
				.pipe concat "#{name}.min.js"
				.pipe ngAnnotate()
				.pipe uglify()
				.pipe gulp.dest(path.jsOut)

gulp.task "js-static", ->
	gulp.src path.js + "materia/*"
		.pipe coffee()
		.pipe gulp.dest(path.jsStatic)

gulp.task 'js', dynamicTasks # add a js task to run all dynamic js-* tasks

gulp.task 'watch', ->
	gulp.watch "#{path.css}**/*.scss", ['css']

	# watch all dynamic js-* tasks
	for name, files of coffeeScripts
		gulp.watch files, ["js-#{name}"]

gulp.task 'css', ->
	gulp.src "#{path.css}*.scss"
		.pipe sass()
		.pipe minifyCss()
		.pipe gulp.dest(path.cssOut)

gulp.task 'default', ['js', 'js-static', 'css', 'watch']
