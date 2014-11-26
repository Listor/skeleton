module.exports = function(grunt) {
  'use strict';

  var distPath = 'dist',
      distCssPath = distPath + '/css',
      appPath = 'app',
      srcPath = 'src',
      jsPath = 'js',
      jsSrcPath = srcPath + '/' + jsPath,
      sassSrcPath = srcPath + '/sass',
      appJsPath = appPath + '/' + jsSrcPath,
      appSassSrcPath = appPath + '/' + sassSrcPath,
      appSrcPath = appPath + '/' + srcPath,
      jsLibPath = jsSrcPath + '/lib',
      tmpPath = '.tmp',
      tmpCssPath = tmpPath + '/css',
      tmpJsPath = tmpPath + '/' + jsPath,
      zipPath = '.zip',
      sassSettingsFile = appSassSrcPath + '/_settings.sass',
      jsSassFile = 'sass.js',
      jsSassPath = appPath + '/' + jsSrcPath + '/' + jsSassFile,
      versionFile = '.progress',
      defaultTarget = 'debug';
  
  var copyCssProcess = function(content){
    return replaceCssVariables(content);
  },

  replaceCssVariables = function(content){
    content = content.replace(/(\r\n|\n|\r)/g, '');
    
    var filePath = '.tmp.' + jsSassFile,
        pattern = "[\$]([a-z-]*)",
        regex = new RegExp(pattern, 'ig'),
        matches = content.match(regex),
        css = JSON.parse(content);
    
    for(var i=0;i<matches.length;i++){
      var current = matches[i],
          key = 'css.' + current.replace('\$', '').replace('-', '.'),
          value = '#f00';
      
      content = content.replace(current, eval(key));
    }
    
    content = content.replace(new RegExp('"color": {[\\s]*(\"[a-z]*\": \"[#,a-z0-9]*\"[,]?[\\s]*)*}, ', 'gi'), '');
    
    return 'var css = ' + content + ';';
  };
  
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-requirejs');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-json2sass');
  grunt.loadNpmTasks('grunt-contrib-clean');
  
  require('time-grunt')(grunt);

  grunt.initConfig({
    "pkg": grunt.file.readJSON('package.json'),
    "sassSettingsFile": sassSettingsFile,
    connect: {
      options: {
        port: 9015,
        livereload: 36813,
        hostname: '0.0.0.0'
      },
      livereload: {
        options: {
          open: 'http://127.0.0.1:<%= connect.options.port %>',
          base: [
             distPath
          ]
        }
      }
    },    
    copy: {
      "tmp-debug": {
        files: [
          {
            expand: true,
            cwd: appSrcPath,
            src: ['**'],
            dest: tmpPath,
            filter: 'isFile'
          }
        ]
      },
      "tmp-release": {
        files: [
          {
            expand: true,
            cwd: appSrcPath,
            src: ['**'],
            dest: tmpPath,
            filter: 'isFile'
          },
          {
            expand: true,
            cwd: appJsPath,
            src: ['**/famous.css'],
            dest: tmpPath
          }
        ]
      },      
      "dist": {
        files: [
          {
            expand: true,
            cwd: tmpPath,
            src: ['**'],
            dest: distPath,
            filter: 'isFile'
          }
        ]        
      },
      "js": {
        files: [
          {
            expand: true,
            cwd: appJsPath,
            src: ['**/*.{js,jsx}'],
            dest: tmpJsPath,
            filter: 'isFile'
          }
        ]
      },
      "sass": {
        src: [jsSassPath],
        dest: tmpJsPath + '/css.js',
        options: {
          processContent: copyCssProcess
        }
      },
      "sassrelease": {
        src: [jsSassPath],
        dest: distPath + '/' + jsPath + '/css.js',
        options: {
          processContent: copyCssProcess
        }
      }      
    },
    watch: {
      options: {
        livereload: '<%= connect.options.livereload %>'
      },
      "main": {
        files: [appSrcPath + '/**.{html,svg,png,eot,ttf,woff}', appJsPath + '/**/*.{js,jsx}', '!' + jsSassPath],
        tasks: ['build']
      },
      "json2sass": {
        files: [jsSassPath],
        tasks: ['sass2js:release']       
      },
      "sass": {
        files: [appSassSrcPath + '/**/*.scss'],
        tasks: ['sass', 'build']
      }
    },
    requirejs: {
      options: {
        appDir: appSrcPath,
        dir: tmpPath,
        mainConfigFile: appJsPath + '/common.js',
        normalizeDirDefines: 'skip',
        keepBuildDir: true,
        skipDirOptimize: true        
      },
      "debug": {
        options: {
          baseUrl: jsPath + '/',
          name: 'lib/requirejs/require'
        }
      },
      "release": {
        options: {
          almond: true,
          optimize: 'uglify2',
          baseUrl: jsPath + '/',
          replaceRequireScript: [{
              files: [tmpPath + '/main.html'],
              module: 'common',
              modulePath: 'js/common'
          }],
          'modules': [{
              'name': 'common'
          }],          
        }
      }
    },
    json2sass: {
      "main": {
        files: {
          '<%= sassSettingsFile %>': jsSassPath
        }
      }
    },
    sass: {
      "debug": {
        files: [{
          expand: true,
          cwd: appSassSrcPath,
          src: ['*.scss'],
          dest: tmpCssPath,
          ext: '.css'
        }]
      },
      "release": {
        files: [{
          expand: true,
          cwd: appSassSrcPath,
          src: ['*.scss'],
          dest: distCssPath,
          ext: '.css'
        }]
      }      
    },
    clean: {
      "tmp": [tmpPath + '/**/*'],
      "dist": [distPath + '/**/*']
    }
  });
  
  grunt.registerTask('build', function(target){
    if(target === undefined){
      target = defaultTarget;
    }
    
    grunt.task.run([
      'newer:copy:js',
      'newer:copy:tmp-' + target,
      'newer:copy:dist'
    ]);    
  });
  
  grunt.registerTask('sass2js', function(target){
    if(target === undefined){
      target = '';
    }    
    
    grunt.task.run([
                    'json2sass',
                    'copy:sass' + target,
                    'sass'
    ]);    
  });
  
  grunt.registerTask('package', function(target){
    if(target === undefined){
      target = defaultTarget;
    }
    
    grunt.task.run([
      'clean',
      'sass2js',
      'requirejs:' + target,
      'build:' + target      
    ]);
  });
  
  grunt.registerTask('server', function(target){
    if(target === undefined){
      target = defaultTarget;
    }
    
    if(target == 'release'){
      grunt.log.error('Release Server doesn\'t work well with changes');
      grunt.log.error('in JS because requirejs is not called at the change moment');
    }
    
    grunt.task.run([
      'package:' + target,
      'connect:livereload',
      'watch'
    ]);
  });
};