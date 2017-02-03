# REQUIRE
# NOTE: put non-production requires inside tasks
gulp          = require 'gulp'
coffee        = require 'gulp-coffee'
sass          = require 'gulp-sass'
concat        = require 'gulp-concat'
uglify        = require 'gulp-uglify' # minify and mangle js
minifyCss     = require 'gulp-minify-css'
ngAnnotate    = require 'gulp-ng-annotate' # protect angular dependency injection from minify
hashsum       = require 'gulp-hashsum-json'
# livereload    = require 'gulp-livereload' # reload the browser when files change

notify = (message) ->
	notifier = require 'node-notifier'
	notifier.notify
		title: "Materia Big Gulp"
		message: message
		wait: true
		sound: true

errHandle = (err) ->
	console.log err
	notify "#{err.name}\n#{err.message}"

	this.emit 'end'


# PATHS
path =
	js:          './src/coffee/'
	jsOut:       './public/themes/default/assets/js/'
	jsStaticOut: './static/js/'
	css:         './src/sass/'
	cssOut:      './public/themes/default/assets/css/'

# JAVASCRIPT
coffeeScripts = [
	{
		name: 'admin', combine: yes, destination: path.jsOut
		files: [
			'controllers/ctrl-admin-user.coffee',
			'controllers/ctrl-admin-widget.coffee',
			'services/srv-admin.coffee'
		]
	},
	{
		name: 'student', combine: yes, destination: path.jsOut
		files: [
			'ng-constants.coffee',
			'services/srv-user.coffee',
			'services/srv-api.coffee',
			'services/srv-datetime.coffee',
			'services/srv-widget.coffee',
			'services/srv-selectedwidget.coffee',
			'services/srv-score.coffee',
			'controllers/ctrl-page.coffee',
			'controllers/ctrl-current-user.coffee',
			'controllers/ctrl-notification.coffee',
			'controllers/ctrl-login.coffee',
			'controllers/ctrl-profile.coffee',
			'controllers/ctrl-scores.coffee',
			'controllers/ctrl-settings.coffee',
			'controllers/ctrl-help.coffee',
			'controllers/ctrl-player.coffee',
			'directives/*'
		]
	},

	{
		name: 'author', combine: yes, destination: path.jsOut
		files: [
			'filters/*',
			'services/*',
			'controllers/ctrl-page.coffee',
			'controllers/ctrl-current-user.coffee',
			'controllers/ctrl-notification.coffee',
			'controllers/ctrl-create.coffee',
			'controllers/ctrl-lti.coffee',
			'controllers/ctrl-media-import.coffee',
			'controllers/ctrl-my-widgets.coffee',
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
			'directives/*'
		]
	},

	{
		name: 'materia', combine: yes, destination: path.jsOut
		files: [
			'materia/materia.namespace.coffee',
			'materia/*.coffee',
			'controllers/ctrl-alert.coffee'
		]
	},

	{
		name: 'static', combine: no, destination: path.jsStaticOut
		files: ['materia/*.coffee']
	}
]

# DYNAMIC JS TASKS
dynamicTasks = []

# prepend the files above with a full path
for group in coffeeScripts
	group.files = (path.js+file for file in group.files) # prepend all files with the js source dir

	name        = group.name
	tskName     = "js-#{name}"
	dest        = group.destination
	files       = group.files
	combine     = group.combine

	dynamicTasks.push tskName # keep track of the task names

	# closures to hold onto local values for name, des, and files
	do (tskName, name, files, dest, combine) ->
		if group.combine
			console.log "dynamic task created: js-#{name} *combined"
			gulp.task tskName, ->
				gulp.src files
					.pipe coffee().on 'error', errHandle
					.pipe concat "#{name}.min.js"
					.pipe ngAnnotate()
					.pipe uglify()
					.pipe gulp.dest(dest)
		else
			console.log "dynamic task created: js-#{name}"
			gulp.task tskName, ->
				gulp.src files
					.pipe coffee().on 'error', errHandle
					.pipe uglify()
					.pipe gulp.dest(dest)

# END Dynamic tasks

gulp.task 'js', dynamicTasks # add a js task to run all dynamic js-* tasks

gulp.task 'hash', ['js', 'css'], ->
	hashOptions =
		jsonOutput: true
		dest: "fuel/app/config"
		relative: "public/"
		filename: "asset_hash.json"

	gulp.src [path.jsOut + "/*.js", path.cssOut + "/*.css"]
		.pipe hashsum(hashOptions)

gulp.task 'watch', ->
	watch = require 'gulp-watch'
	gulp.watch "#{path.css}**/*.scss", ['css']

	# watch all dynamic js-* tasks
	for group in coffeeScripts
		gulp.watch group.files, ["js-#{group.name}"]

gulp.task 'css', ->
	gulp.src "#{path.css}*.scss"
		.pipe sass().on 'error', errHandle
		.pipe minifyCss()
		.pipe gulp.dest(path.cssOut)

gulp.task 'default', ['js', 'css', 'hash', 'watch']
