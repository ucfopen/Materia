var clean = require('gulp-clean');
var gulp = require('gulp');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var zip = require('gulp-zip');

var widget = "test_widget_two";

// Squish those files and assets into that zip file
gulp.task('compress', function()
{
	return gulp.src(['src/**/*'])
		.pipe(zip('out.zip'))
		.pipe(gulp.dest('.build/'));
});

// Move zipped package into the "materia test widgets folder" folder
gulp.task('copy', function()
{
	return gulp.src(['.build/out.zip'])
		.pipe(rename(widget+'.wigt'))
		.pipe(gulp.dest('../../widget_packages/'));
});

// Cleans up
gulp.task('clean', function()
{
	return gulp.src(['.build/'])
		.pipe(clean())
});

gulp.task('default', function ()
{
	runSequence(
		'compress',
		'copy',
		'clean'
	);
});
