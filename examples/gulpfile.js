var gulp = require('gulp'),
    gutil = require('gulp-util'),
    stylus = require('gulp-stylus'),
    clean = require('gulp-clean'),
    notify = require('gulp-notify'),
    livereload = require('gulp-livereload'),
    spawn = require('child_process').spawn;

var server, supervisor,
    paths = {
       jade: 'views/**/*.jade',
       styl: 'views/css/**/*.styl',
       public: ['public/**/*']
    };

gulp.task('style', function() {
   return gulp.src(paths.styl)
      .pipe(stylus())
      .pipe(gulp.dest('public/css'))
      // .pipe(notify({message: "Styles compiled"}))
      ;
});

gulp.task('reloaders', function() {
   server = livereload();

   supervisor = spawn('supervisor', ['-i', './public,./views', 'app.js']);
   supervisor.stdout.on('data', function(data) {
      process.stdout.write(data);
   });
   supervisor.stderr.on('data', function(data) {
      process.stderr.write(data);
   });
});

gulp.task('watch', ['reloaders'], function() {
   gulp.watch(paths.styl, ['style']);

   gulp.watch(paths.jade).on('change', reloadClient);
   gulp.watch(paths.public).on('change', reloadClient);
});

function reloadClient(ev) {
   server.changed(ev.path);
}

gulp.task('clean', function() {
   return gulp.src(['public/css/'], {read: false})
      .pipe(clean())
      // .pipe(notify(message: "Project cleaned"))
      ;
});

gulp.task('default', function() {
   gulp.start('style', 'watch');
});
