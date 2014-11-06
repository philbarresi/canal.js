module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        typescript: {
            base: {
                src: ['src/<%= pkg.name %>.ts'],
                dest: 'build/<%= pkg.name %>.js',
                options: {
                    target: 'es5',
                    sourceMap: true,
                    declaration: true
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'build/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        src: ['build/<%= pkg.name %>.js', 'build/<%= pkg.name %>.js.map', 'build/<%= pkg.name %>.min.js'],
                        dest: 'dist/',
                        filter: 'isFile',
                        flatten: true
                    }
    ],
            },
        },
        watch: {
            src: {
                files: ['src/*.ts'],
                tasks: ['default'],
            }
        }
    });

    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['typescript', 'uglify', 'copy']);
};