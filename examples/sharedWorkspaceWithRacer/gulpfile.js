var gulp = require('gulp'),
    gutil = require('gulp-util'),
    stylus = require('gulp-stylus'),
    clean = require('gulp-clean'),
    notify = require('gulp-notify'),
    spawn = require('child_process').spawn;

var supervisor,
    paths = {
       jade: 'views/**/*.jade',
       styl: 'views/css/**/*.styl',
       public: ['public/**/*']
    };

gulp.task('styles', function() {
   return gulp.src(paths.styl)
      .pipe(stylus())
      .pipe(gulp.dest('public/css'))
      // .pipe(notify({message: "Styles compiled"}))
      ;
});

gulp.task('reloaders', function() {
   supervisor = spawn('supervisor', ['-i', './public,./views', 'app.js'],
      { stdio: 'inherit' });
});

gulp.task('watch', ['reloaders'], function() {
   gulp.watch(paths.styl, ['styles']);
});

gulp.task('clean', function() {
   return gulp.src(['public/css/'], {read: false})
      .pipe(clean())
      // .pipe(notify(message: "Project cleaned"))
      ;
});

gulp.task('default', function() {
   gulp.start('styles', 'watch');
});
