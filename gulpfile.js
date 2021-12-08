var gulp = require('gulp')
var uglify = require('gulp-uglify');
var browserify = require('browserify')

gulp.task('build', async ()=> {
    return browserify({
        entries: 'src/*.js',
        debug: false
    })
    .bundle()
    .on('error', function (error) {
        console.log(error.toString())
    })
    .pipe(stream('index.js'))
    // 转成二进制的流（二进制方式整体传输）
    .pipe(buffer())
    // 输出
    .pipe(gulp.dest('dist/js/'))
})