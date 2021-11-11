var gulp = require('gulp')
var uglify = require('gulp-uglify');

gulp.task('build', async ()=> {
    await gulp.src('src/*.js')
              .pipe(uglify())
              .pipe(gulp.dest('dist/js'))
})