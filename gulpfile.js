const gulp = require('gulp'),

    plumber = require('gulp-plumber'),

    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),

    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),

    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    lazypipe = require('lazypipe'),
    htmlmin = require('gulp-htmlmin'),
    sourcemaps = require('gulp-sourcemaps'),

    imagemin = require('gulp-imagemin'),

    rename = require('gulp-rename'),

    clean = require('gulp-clean'),

    browserSync = require('browser-sync').create(),

    order = require("gulp-order"),
    EventProxy = require('eventproxy'),
    ep = new EventProxy(),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    fileinclude = require('gulp-file-include'),
    filter = require('gulp-filter'),
    gulpSequence = require('gulp-sequence'),
    path = require('path'),
    fs = require('fs');

function mkdirs(dirpath, isFile, mode, callback, cbArgs) {
    fs.exists(dirpath, function(exists) {
        if (exists) {
            callback();
        } else {
            //尝试创建父目录，然后再创建当前目录
            mkdirs(path.dirname(dirpath), false, mode, function() {
                if (isFile) {
                    fs.createWriteStream(dirpath);
                    if (typeof callback == 'function') {
                        callback(cbArgs);
                    }
                } else {
                    fs.mkdir(dirpath, mode, callback);
                }
            });
        }
    });
}

// 清理
gulp.task('clean', function() {
    return gulp.src('dist/', {
            read: false
        })
        .pipe(clean());
});

function writeFile(filePath, data) {
    fs.createWriteStream(filePath);
    fs.writeFile(filePath, data, {
        flag: 'w',
        encoding: 'utf-8',
        mode: '0666'
    }, function(err) {
        if (err) {
            console.log("文件写入失败")
        } else {
            console.log("文件写入成功");
        }
    })
}

// 第一次运行gulp任务的时候用以创建src目录以及其子目录
gulp.task('createDir', function() {
    fs.exists('./src/.create', function(exists) {
        if (exists) {
            return;
        } else {
            const createContent = '标识src目录结构是否已经创建过~故此文件不应单独删除~否则gulp会再次尝试创建src目录结构';
            const commonStyleContent = '/*由gulp任务生成的公共样式文件*/';

            const commnStyleTpl = `<!-- 由glup任务生成的公共样式 -->
<!-- build:css /css/common/combined.css -->
    <link rel="stylesheet" href="../../css/common/cn.css">
<!-- endbuild -->`;

            const commonScriptTpl = `<!-- 由glup任务生成的公共脚本 -->
<!-- build:js /js/common/combined.js -->
    <script src="../../js/common/cn.js"></script>
<!-- endbuild -->`;

            const indexTpl = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>

    @@include('../include/common_styles.html')
    <!-- build:css /css/pages/index.css -->
    <link rel="stylesheet" href="../../css/common/cn.css">
    <!-- endbuild -->

</head>
<body>
    @@include('../include/header.html')
    <div>
        this is index
    </div>
    @@include('../include/footer.html')

    @@include('../include/common_script.html')

    <!-- build:js /js/pages/index.js -->
    <script src="../../js/common/cn.js"></script>
    <!-- endbuild -->
</body>
</html>`

            mkdirs('./src/.create', true, '0666', function(cbArgs) {
                writeFile(cbArgs.path, cbArgs.content);
            }, {
                path: './src/.create',
                content: createContent
            });

            mkdirs('./src/images', false);
            mkdirs('./src/js/pages', false);
            mkdirs('./src/js/libs', false);
            mkdirs('./src/js/common', false, '0666', function() {
                mkdirs('./src/js/common/cn.js', true);
            });
            mkdirs('./src/css/pages', false);
            mkdirs('./src/css/common', false, '0666', function() {
                mkdirs('./src/css/common/cn.css', true, '0666', function(cbArgs) {
                    writeFile(cbArgs.path, cbArgs.content);
                }, {
                    path: './src/css/common/cn.css',
                    content: commonStyleContent
                });
            });
            mkdirs('./src/tpl/pages', false, '0666', function() {
                mkdirs('./src/tpl/pages/index.html', true, '0666', function(cbArgs) {
                    writeFile(cbArgs.path, cbArgs.content);
                }, {
                    path: './src/tpl/pages/index.html',
                    content: indexTpl
                });
            });
            mkdirs('./src/tpl/include', false, '0666', function() {
                mkdirs('./src/tpl/include/header.html', true);

                mkdirs('./src/tpl/include/common_styles.html', true, '0666', function(cbArgs) {
                    writeFile(cbArgs.path, cbArgs.content);
                }, {
                    path: './src/tpl/include/common_styles.html',
                    content: commnStyleTpl
                });

                mkdirs('./src/tpl/include/common_script.html', true, '0666', function(cbArgs) {
                    writeFile(cbArgs.path, cbArgs.content);
                }, {
                    path: './src/tpl/include/common_script.html',
                    content: commonScriptTpl
                });

                mkdirs('./src/tpl/include/footer.html', true);
            });
        }
    })
});

gulp.task('clean:build', function() {
    return gulp.src('package/', {
            read: false
        })
        .pipe(clean());
});

// 图片
gulp.task('images', function() {
    return gulp.src('src/images/**/*')
        .pipe(plumber({
            errorHandler: function(err) {
                this.emit('end');
            }
        }))
        .pipe(cache(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist/'));
});

gulp.task('images:build', function() {
    return gulp.src('src/images/**/*')
        .pipe(plumber({
            errorHandler: function(err) {
                this.emit('end');
            }
        }))
        .pipe(cache(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('package/'));
});

//Html
gulp.task('pageHtml', ['indexHtml'], function() {
    return gulp.src(['src/**/*.html', '!src/tpl/include/*.html', '!src/tpl/pages/index.html'])
        .pipe(plumber({
            errorHandler: function(err) {
                this.emit('end');
            }
        }))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(useref({}, lazypipe().pipe(sourcemaps.init, {
            loadMaps: true
        })))
        .pipe(gulpif('*.css', autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4')))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('dist/'))
});

gulp.task('indexHtml', function() {
    return gulp.src('src/tpl/pages/index.html')
        .pipe(plumber({
            errorHandler: function(err) {
                this.emit('end');
            }
        }))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(useref({}, lazypipe().pipe(sourcemaps.init, {
            loadMaps: true
        })))
        .pipe(gulpif('*.css', autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4')))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('dist/'))
});

gulp.task('pageHtml:build', ['indexHtml:build'], function() {
    var options = {
        removeComments: true, //清除HTML注释
        collapseWhitespace: true, //压缩HTML
        collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
        minifyJS: true, //压缩页面JS
        minifyCSS: true //压缩页面CSS
    };

    var jsFilter = filter(['**/*.js'], {
        restore: true
    });
    var cssFilter = filter(['**/*.css'], {
        restore: true
    });

    return gulp.src(['src/**/*.html', '!src/tpl/include/*.html', '!src/tpl/pages/index.html'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(useref())
        .pipe(jsFilter)
        .pipe(uglify())
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(minifycss())
        .pipe(cssFilter.restore)
        .pipe(gulpif('*.html', htmlmin(options)))
        .pipe(gulp.dest('package/'));
});

gulp.task('indexHtml:build', function() {
    var options = {
        removeComments: true, //清除HTML注释
        collapseWhitespace: true, //压缩HTML
        collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
        minifyJS: true, //压缩页面JS
        minifyCSS: true //压缩页面CSS
    };

    var jsFilter = filter(['**/*.js'], {
        restore: true
    });
    var cssFilter = filter(['**/*.css'], {
        restore: true
    });

    return gulp.src('src/tpl/pages/index.html')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(useref())
        .pipe(jsFilter)
        .pipe(uglify())
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(minifycss())
        .pipe(cssFilter.restore)
        .pipe(gulpif('*.html', htmlmin(options)))
        .pipe(gulp.dest('package/'));
});

gulp.task('watch', function() {

    gulp.watch('src/css/**/*.css', ['pageHtml']);

    gulp.watch('src/js/**/*.js', ['pageHtml']);

    gulp.watch('src/images/**/*', ['images']);

    gulp.watch('src/tpl/**/*.html', ['pageHtml']);

    gulp.watch(['dist/**']).on('change', browserSync.reload);

});

gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./dist/"
        }
    });
});

gulp.task('default', ['clean'], gulpSequence('pageHtml', ['images'], 'watch', 'server'));
gulp.task('build', gulpSequence('clean:build', 'pageHtml:build'));