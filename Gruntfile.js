module.exports = function (grunt) {
    var pkg = grunt.file.readJSON('package.json');

    // Project configuration.
    grunt.initConfig({
        pkg: pkg,
        clean: ["build"],
        typescript: {
            base: {
                src: ['src/<%= pkg.name %>.ts'],
                dest: 'build/<%= pkg.name %>.js',
                options: {
                    target: 'es5',
                    sourceMap: true,
                    declaration: true
                }
            },
            tests: {
                src: ['src/<%= pkg.name %>.tests.ts'],
                dest: 'build/<%= pkg.name %>.tests.js'
            }
        },
        uglify: {
            options: {
                banner: '/*!<%= pkg.name %> v<%= pkg.version %><%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'build/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        copy: {
            dev: {
                files: [
                    {
                        expand: true,
                        src: ['build/<%= pkg.name %>.js', 'build/<%= pkg.name %>.js.map', 'build/<%= pkg.name %>.d.ts', 'build/<%= pkg.name %>.min.js'],
                        dest: 'dist/',
                        filter: 'isFile',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + "/dev/" + src;
                        }
                    }
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        src: ['build/<%= pkg.name %>.js', 'build/<%= pkg.name %>.js.map', 'build/<%= pkg.name %>.d.ts', 'build/<%= pkg.name %>.min.js'],
                        dest: 'dist/',
                        filter: 'isFile',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + "/" + pkg.version + "/" + src;
                        }
                    }
                ]
            },
            edge: {
                files: [
                    {
                        expand: true,
                        src: ['build/<%= pkg.name %>.js', 'build/<%= pkg.name %>.js.map', 'build/<%= pkg.name %>.d.ts', 'build/<%= pkg.name %>.min.js'],
                        dest: 'dist/',
                        filter: 'isFile',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + "/edge/" + src;
                        }
                    }
                ]
            }
        },
        watch: {
            src: {
                files: ['src/*.ts'],
                tasks: ['default']
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['clean', 'typescript', 'uglify', 'copy:dev', 'karma']);
    grunt.registerTask('dist', ['clean', 'typescript', 'uglify', 'copy:dev', 'karma', 'copy:dist', 'copy:edge']);
};