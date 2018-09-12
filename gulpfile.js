const gulp = require('gulp');
const clean = require('gulp-clean');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', ['static'], generateScriptsTask);
gulp.task('static', ['clean'], staticFilesTask);
gulp.task('clean', cleanTask);
gulp.task('build', ['scripts']);
gulp.task('watch', ['build'], watchTask);
gulp.task('default', ['watch']);

function generateScriptsTask() {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'))
}

function staticFilesTask() {
  return gulp.src(['src/**/*.json', 'src/**/*.sqlite']).pipe(gulp.dest('dist'));
}

function cleanTask() {
  return gulp.src('dist').pipe(clean());
}

function watchTask() {
  return gulp.watch(['src/**/*.ts', 'src/**/*.json'], ['build']);
}
