module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({


    // load metadata from package file
    pkg: grunt.file.readJSON('package.json'),

    env : { 
      options : {
      },
      dev: {
        NODE_ENV : 'DEVELOPMENT'
      },
      prod : {
        NODE_ENV : 'PRODUCTION'
      }
    },
    preprocess : {
      dev : {
        src : './src/tmpl/index.html',
        dest : './src/index.html'
      },
      prod : {
        src : './src/tmpl/index.html',
        dest : './build/index.html',
        options : {
          context : {
            name : '<%= pkg.name %>',
            version : '<%= pkg.version %>',
            now : '<%= now %>',
            ver : '<%= ver %>'
          }
        }
      }
    },
    clean: {
      prod: [ 'build/js/*.js', 'build/css/', 'dist/']
    },

    // Location of javascript files to use
    srcPath: 'src/',
    jsPath: 'src/js/*.js',
    cssPath: 'src/css/',

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        // the files to concatenate
        src: ['<%= jsPath %>'],
        // the location of the resulting JS file
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        mangle: true,
        banner: '/*! <%= pkg.name %><%= pkg.version %><%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: {
          'build/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    jshint: {
      files: ['<%= jsPath %>'],
      options: {
        // more options here if you want to override JSHint defaults
        globals: {
          jQuery: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: '<%= cssPath %>',
        src: ['*.css'],
        dest: 'build/css/',
        ext: '.min.css'
      }
    }
  });

  // Load the plugins that provides the tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-env');
  // this would be run by typing "grunt test" on the command line
  grunt.registerTask('test', ['jshint']);

  grunt.registerTask('dev', ['jshint', 'env:dev', 'preprocess:dev']);


  // the default task can be run just by typing "grunt" on the command line
  grunt.registerTask('default', ['jshint', 'env:prod', 'clean:prod', 'concat', 'uglify', 'cssmin', 'preprocess:prod']);

};