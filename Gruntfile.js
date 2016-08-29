module.exports = function(grunt) {
  var uglifyCompressOptions = {
    global_defs: {
      DEBUG: false,
      DEVMODE: true,
    },
    dead_code: true
  };
  var uglifyCompressOptionsProc = {
    global_defs: {
      DEBUG: false,
      DEVMODE: false,
    },
    dead_code: true
  };

  var filterFolder = ["!node_modules/**", "!spm_modules/**", "!bower_components/**", "!egret-working/**", "!version/**"];

  var imageminSrc = [
    "**/*.jpg",
    "**/*.png",
    "**/*.gif",
  ].concat(filterFolder);
  var defineImageOptions = {
    all: true,
    filterList: [],
    keepList: [],
  }

  function getImagemin() {
    var item = null;
    if (defineImageOptions.all) {
      return imageminSrc;
    } else {
      var cacheList = [];
      for (var i = 0; i < defineImageOptions.keepList.length; i++) {
        item = defineImageOptions.keepList[i];
        if (item[item.length - 1] !== '/') {
          item = item + '/'
        }
        cacheList = defineImageOptions.filterList.concat([item + '**/*.jpg', item + '**/*.png', item + '**/*.gif']);
      };
      return imageminSrc.concat(cacheList);
    }
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    meta: {
      file: 'main',
      banner: '/* <%= pkg.name %> - <%= grunt.template.today("yyyy/mm/dd") %>\n' + '   <%= pkg.homepage %>\n' + '   Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> */\n'
    },

    clean: {
      options: {
        force: true
      },
      build: ["build/*"]
    },

    uglify: {
      options: {
        compress: uglifyCompressOptions,
        mangle: true,
        preserveComments: false,
        report: "min",
        banner: "<%= meta.banner %>"
      },
      // build: {
      //   files: [{
      //     "build/main.js": ["main.js", "init.js"],
      //     "build/js/frame.js": ["js/frame.js", "js/jquery.js", "js/jquery.mobile.custom.js", "js/jquery.browser.js", "js/cookie.js", "js/storage.js", "js/jquery.md5.js", "js/url.js", "js/spin.js", "js/iscroll.js", "js/WeixinApi.js", "js/weixin.js", "js/plug-in.js", "js/api.js", 'js/pickadate.js']
      //   }, {
      //     expand: true,
      //     src: ["**/*.js", "!js/frame.js", "!node_modules/**", "!*.js", "!bower_components/**", "!egret-working/**", "!version/**"],
      //     dest: "build/"
      //   }, ]
      // },
      proc: {
        options: {
          compress: uglifyCompressOptionsProc
        },
        files: [{
          "build/main.js": ["main.js"],
          "build/init.js": ["js/*.js"]
        },{
          expand: true,
          src: ["!*.js"].concat(filterFolder),
          dest: "build/"
        }]
      }
    },

    stylus: {
      build: {
        files: [{
          src: ["**/*.styl"].concat(filterFolder),
          ext: ".css",
          expand: true
        }]
      }
    },

    cssmin: {
      options: {
        keepSpecialComments: 0,
        report: 'min'
      },
      build: {
        files: [{
          expand: true,
          src: ["**/*.css", "!css/*.css", "css/main.css"].concat(filterFolder),
          dest: "build/"
        }]
      }
    },

    htmlmin: {
      options: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        removeOptionalTags: true,
      },
      build: {
        files: [{
          expand: true,
          src: [
            "**/*.html",
          ].concat(filterFolder),
          dest: "build/"
        }]
      }
    },

    htmlparse: {
      build: {
        files: [{
          src: "build/**/*.html",
          expand: true
        }]
      },
      proc: {
        files: [{
          src: "build/**/*.html",
          expand: true
        }]
      }
    },

    imagemin: {
      build: {
        files: [{
          src: getImagemin(),
          dest: "build/",
          expand: true
        }]
      }
    },

    copy: {
      build: {
        files: [{
          src: [
            '**/*.gif',
            '**/*.mp3',
            '**/*.eot',
            '**/*.svg',
            '**/*.ttf',
            '**/*.woff',
            '**/*.ts',
            '**/*.manifest'
          ].concat(filterFolder),
          dest: 'build/',
          expand: true
        }, {
          src: ['**/*.json', '!libs/**/*.json', '!package.json', '!node_modules/**/*.json', '!spm_modules/**/*.json', "!bower_components/**/*.json", "!egret-working/**/*.json"],
          dest: 'build/',
          expand: true
        }]
      },
      orig: {
        files: [{
          src: ['build/*.html'],
          ext: '.orig.html',
          expand: true
        }, {
          src: ['build/main.js'],
          ext: '.orig.js',
          expand: true
        }]
      }
    },

    compress: {
      options: {
        mode: "gzip",
        level: 9,
        pretty: true
      },
      build: {
        files: [{
          src: "build/**/*.js",
          expand: true
        }, {
          src: "build/**/*.css",
          expand: true
        }, {
          src: ["build/**/*.html", "!build/**/*.orig.html"],
          expand: true
        }]
      }
    },

    // rsync: {
    //   options: {
    //     args: ['-ltDvz'],
    //     // exclude: ['.git*', 'node_modules'],
    //     recursive: true,
    //     compareMode: 'checksum',
    //     src: 'build/'
    //   },
    //   proc: {
    //     options: {
    //       dest: '/var/www/weixin-demo/demo1/htdocs/',
    //       exclude: [''],
    //       host: '',
    //       // syncDestIgnoreExcl: true
    //     }
    //   },
    //   dev: {
    //     options: {
    //       dest: '/var/www/weixin-demo/test/htdocs/',
    //       host: '',
    //       // syncDestIgnoreExcl: true
    //     }
    //   }
    // }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-rsync');

  grunt.registerMultiTask('htmlparse', 'parse html files', function(name) {
    var fs = require('fs');
    var UglifyJS = require('uglify-js');
    var config = grunt.config.get();
    var compressOptions = this.target == 'proc' ? uglifyCompressOptionsProc : uglifyCompressOptions;
    this.files.forEach(function(file) {
      var src = file.src[0];
      var content = fs.readFileSync(src, 'utf8');

      // SEO
      // content = content.replace(/<title>/,
      //                             '<meta name="apple-itunes-app" content="app-id=">'
      //                           + '<meta name="keywords" content="">'
      //                           + '<meta name="description" content="">'
      //                           + '<title>'
      //                           );

      content = content.replace(/<script>([\s\S]*?)<\/script>/ig, function(all, js) {
        var code;
        try {
          code = UglifyJS.minify(js, {
            fromString: true,
            mangle: true,
            compress: compressOptions
          }).code;
        } catch (e) {
          grunt.fail.fatal(e.message + ' in file ' + file.dest +
            ' [' + e.line + ':' + e.col + '] ');
        }
        return '<script>' + code + '</script>';
      });

      // content = content.replace(/<html>/i, function() {
      //     return shouldCache(src) ? '<html manifest="cache.manifest">'
      //                             : '<html>';
      // });

      fs.writeFileSync(file.dest, content);

      grunt.log.writeln("File", file.dest, "processed.");
    });
  });

  grunt.registerTask('build:dev', [
    'clean:build',
    'uglify:build',
    'stylus:build',
    'copy:build',
    'cssmin:build',
    'htmlmin:build',
    'htmlparse:build',
    'imagemin:build',
    'compress:build'
  ]);

  grunt.registerTask('build:proc', [
    'clean:build',
    'uglify:proc',
    'stylus:build',
    'copy:build',
    'cssmin:build',
    'htmlmin:build',
    'htmlparse:proc',
    'imagemin:build',
    'copy:orig',
    'compress:build'
  ]);

  // grunt.registerTask('deploy:proc', ['rsync:proc']);
  // grunt.registerTask('deploy:dev', ['rsync:dev']);

  // grunt.registerTask('proc', ['build:proc', 'deploy:proc']);
  // grunt.registerTask('default', ['build:dev', 'deploy:dev']);
};