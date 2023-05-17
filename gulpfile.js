var gulp = require('gulp')
var ts = require('gulp-typescript')
var tsProject = ts.createProject('tsconfig.json')
var OUT_DIR = 'lambda'
var IN_DIR = 'src'

// Compile typescript
gulp.task('compile', function () {
    return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest(OUT_DIR))
})

// Copy json files (e.g. localization json)
gulp.task('json', function () {
    return gulp.src([IN_DIR + '/**/*.json', '!*/node_modules/**/*']).pipe(gulp.dest(OUT_DIR))
})

// Default task
gulp.task('default', gulp.series('compile', 'json'))

function watchCallback(cb) {
    // Run the tasks
    gulp.series('compile', 'json')(cb)
}

gulp.watch('src/*', { events: 'all' }, watchCallback)
