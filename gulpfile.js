'use strict';

var gulp = require('gulp'),
    shell = require('gulp-shell'),
    runSequence = require('run-sequence'),
    del = require('del');

gulp.task('server', function (callback) {
    runSequence(['clean', 'tsc', 'karma'], callback)
});

gulp.task('tsc', shell.task('tsc -w -p .'));
gulp.task('browserify', shell.task('browserify src -p [ tsify --noImplicitAny ] -о build/src/bundle.js'));
gulp.task('node', shell.task('node ./build/src/app.js'));
gulp.task('karma', shell.task('powershell -Command "./karma.ps1"'));
gulp.task('clean', function () {
   return del(['build/src/**/*.js', '!build/src/**/main.js', '!build/src/**/app.js', 'src/**/*.js', 'tests/**/*.js', '!tests/**/test-main.js']); 
});