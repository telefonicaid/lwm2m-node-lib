/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of iotagent-lwm2m-lib
 *
 * iotagent-lwm2m-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-lwm2m-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-lwm2m-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */
'use strict';

/**
 * Grunt tasks definitions
 *
 * @param {Object} grunt
 */
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkgFile: 'package.json',
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            reportTest: ['report/test'],
            reportLint: ['report/lint'],
            reportCoverage: ['report/coverage'],
            siteCoverage: ['site/coverage'],
            siteDoc: ['site/doc'],
            siteReport: ['site/report']
        },

        mkdir: {
            reportTest: {
                options: {
                    create: ['<%= clean.reportTest[0] %>']
                }
            },
            reportLint: {
                options: {
                    create: ['<%= clean.reportLint[0] %>']
                }
            },
            reportCoverage: {
                options: {
                    create: ['<%= clean.reportCoverage[0] %>']
                }
            },
            siteCoverage: {
                options: {
                    create: ['<%= clean.siteCoverage[0] %>']
                }
            },
            siteDoc: {
                options: {
                    create: ['<%= clean.siteDoc[0] %>']
                }
            },
            siteReport: {
                options: {
                    create: ['<%= clean.siteReport[0] %>']
                }
            }
        },

        jshint: {
            gruntfile: {
                src: 'Gruntfile.js',
                options: {
                    jshintrc: '.jshintrc'
                }
            },
            lib: {
                src: ['lib/**/*.js'],
                options: {
                    jshintrc: '.jshintrc'
                }
            },
            test: {
                src: ['test/**/*.js'],
                options: {
                    jshintrc: 'test/.jshintrc'
                }
            },
            reportGruntfile: {
                src: 'Gruntfile.js',
                options: {
                    reporter: 'checkstyle',
                    reporterOutput: '<%= clean.reportLint[0] %>/jshint-gruntfile.xml',
                    jshintrc: '.jshintrc'
                }
            },
            reportLib: {
                src: 'lib/**/*.js',
                options: {
                    reporter: 'checkstyle',
                    reporterOutput: '<%= clean.reportLint[0] %>/jshint-lib.xml',
                    jshintrc: 'lib/.jshintrc'
                }
            },
            reportTest: {
                src: 'test/**/*.js',
                options: {
                    reporter: 'checkstyle',
                    reporterOutput: '<%= clean.reportLint[0] %>/jshint-test.xml',
                    jshintrc: 'test/.jshintrc'
                }
            }
        },

        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib: {
                files: '<%= jshint.lib.src %>',
                tasks: ['jshint:lib', 'test']
            },
            test: {
                files: '<%= jshint.test.src %>',
                tasks: ['jshint:test', 'test']
            }
        },

        mochaTest: {
            unit: {
                options: {
                    ui: 'bdd',
                    reporter: 'spec',
                    timeout: 2000
                },
                src: [
                    'tools/mocha-globals.js',
                    '<%= jshint.test.src %>'
                ]
            },
            unitReport: {
                options: {
                    ui: 'bdd',
                    reporter: 'tap',
                    quiet: true,
                    captureFile: '<%= clean.reportTest[0] %>/unit_tests.tap'
                },
                src: [
                    'tools/mocha-globals.js',
                    '<%= jshint.test.src %>'
                ]
            }
        },

        githubPages: {
            target: {
                options: {
                    commitMessage: 'UPDATE Doc'
                },
                src: 'site'
            }
        },

        dox: {
            options: {
                title: 'iotagent-lwm2m-lib documentation'
            },
            files: {
                src: ['<%= jshint.lib.src %>'],
                dest: '<%= clean.siteDoc[0] %>'
            }
        },

        exec: {
            istanbul: {
                cmd:
                    'bash -c "./node_modules/.bin/istanbul cover --root lib/ --dir <%= clean.siteCoverage[0] %> -- ' +
                    '\\"`npm root -g`/grunt-cli/bin/grunt\\" test && ' +
                    './node_modules/.bin/istanbul report --dir <%= clean.siteCoverage[0] %> text-summary"'
            },
            istanbulCobertura: {
                cmd:
                    'bash -c "./node_modules/.bin/istanbul report --dir <%= clean.siteCoverage[0] %> cobertura && ' +
                    'mv <%= clean.siteCoverage[0] %>/cobertura-coverage.xml <%= clean.reportCoverage[0] %>"'
            },
            githubPagesInit: {
                cmd: 'bash tools/github-pages.sh'
            }
        },

        plato: {
            options: {
                jshint: grunt.file.readJSON('.jshintrc')
            },
            lib: {
                files: {
                    '<%= clean.siteReport[0] %>': '<%= jshint.lib.src %>'
                }
            }
        },

        githooks: {
          all: {
            'pre-commit': 'lint test'
          }
        },

        gjslint: {
            options: {
                reporter: {
                    name: 'console'
                },
                flags: [
                    '--flagfile .gjslintrc' //use flag file'
                ],
                force: false
            },
            gruntfile: {
                src: '<%= jshint.gruntfile.src %>'
            },
            lib: {
                src: '<%= jshint.lib.src %>'
            },
            test: {
                src: '<%= jshint.test.src %>'
            },
            report: {
                options: {
                    reporter: {
                        name: 'gjslint_xml',
                        dest: '<%= clean.reportLint[0] %>/gjslint.xml'
                    },
                    flags: [
                        '--flagfile .gjslintrc'
                    ],
                    force: false
                },
                src: ['<%= jshint.gruntfile.src %>', '<%= jshint.lib.src %>', '<%= jshint.test.src %>']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-github-pages');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-plato');
    grunt.loadNpmTasks('grunt-gjslint');
    grunt.loadNpmTasks('grunt-dox');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-githooks');

    grunt.loadTasks('tools/tasks');

    grunt.registerTask('init-pages', ['exec:githubPagesInit']);

    grunt.registerTask('test', 'Run tests', ['mochaTest:unit']);

    grunt.registerTask('test-report', 'Generate tests reports',
        ['clean:reportTest', 'mkdir:reportTest', 'mochaTest:unitReport']);

    grunt.registerTask('coverage', 'Print coverage report',
        ['clean:siteCoverage', 'exec:istanbul']);

    grunt.registerTask('coverage-report', 'Generate Cobertura report',
        ['clean:reportCoverage', 'mkdir:reportCoverage', 'coverage', 'exec:istanbulCobertura']);

    grunt.registerTask('complexity', 'Generate code complexity reports', ['plato']);

    grunt.registerTask('doc', 'Generate source code JSDoc', ['dox']);

    grunt.registerTask('lint-jshint', 'Check source code style with JsHint',
        ['jshint:gruntfile', 'jshint:lib', 'jshint:test']);

    grunt.registerTask('lint-gjslint', 'Check source code style with Google Closure Linter',
        ['gjslint:gruntfile', 'gjslint:lib', 'gjslint:test']);

    grunt.registerTask('lint', 'Check source code style', ['lint-jshint', 'lint-gjslint']);

    grunt.registerTask('lint-report', 'Generate checkstyle reports',
        ['clean:reportLint', 'mkdir:reportLint', 'jshint:reportGruntfile', 'jshint:reportLib',
        'jshint:reportTest', 'gjslint:report']);

    grunt.registerTask('site', ['doc', 'coverage', 'complexity', 'githubPages']);

    grunt.registerTask('init-dev-env', ['githooks']);

    // Default task.
    grunt.registerTask('default', ['lint-jshint', 'test']);

};
