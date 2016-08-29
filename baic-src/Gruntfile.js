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

  var filterFolder = ["!node_modules/**"];

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
      build: {
        options: {
          compress: uglifyCompressOptionsProc
        },
        files: [{
          "build/baic.js": ["src/core.js", "src/dom.js" ,"src/*.js"]
        },{
          expand: true,
          src: ["!*.js"].concat(filterFolder),
          dest: "build/"
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', [
    'clean:build',
    'uglify:build'
  ]);
};