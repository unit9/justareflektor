/**
 * @author Paweł Klimkowski pawel@sqrtx.pl
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/01/13
 */

module.exports = function (grunt) {

    'use strict';

    var $jsLibs = [

            'js/lib/jquery-2.0.0.js',
            'js/lib/compatibility.js',
            'js/lib/oo.js',
            'js/lib/i18next-1.6.3.js',
            'js/lib/handlebars.runtime.js',
            'js/lib/TweenLite.js',
            'js/lib/EasePack.min.js',
            'js/lib/CSSPlugin.js',
            'js/lib/three.js',
            'js/lib/perlin.js',
            'js/lib/TimelineMerge.js',
            'js/lib/WebglPerformanceTest.js',

            // tailbone.Mesh
            '../../../../tailbone/globals.js',
            '../../../../tailbone/mesh/js/EventDispatcher.js',
            '../../../../tailbone/mesh/js/StateDrive.js',
            '../../../../tailbone/mesh/js/Channel.js',
            '../../../../tailbone/mesh/js/SocketChannel.js',
            '../../../../tailbone/mesh/js/RTCChannel.js',
            '../../../../tailbone/mesh/js/SocketMultiplexer.js',
            '../../../../tailbone/mesh/js/ChannelChannel.js',
            '../../../../tailbone/mesh/js/ChannelMultiplexer.js',
            '../../../../tailbone/mesh/js/Peers.js',
            '../../../../tailbone/mesh/js/Node.js',
            '../../../../tailbone/mesh/js/Mesh.js',
            '../../../../tailbone/clocksync/clocksync.js'

        ],
        $jsClasses = [

            'js/config/ConfigCommon.js',
            'js/config/ConfigLocal.js',
            'js/config/ConfigDev.js',
            'js/config/ConfigTest.js',
            'js/config/ConfigProd.js',
            'js/config/Config.js',

            'js/debug/Debug.js',

            'js/tracking/Tracking.js',

            'js/controller/AppController.js',
            'js/controller/DetectionController.js',
            'js/controller/PreloadController.js',
            'js/controller/LocalisationController.js',
            'js/controller/RoutingControllerBase.js',
            'js/controller/RoutingController.js',
            'js/controller/ViewController.js',
            'js/controller/SharingController.js',
            'js/controller/FullScreenController.js',
            'js/controller/RemoteController.js',
            'js/controller/PerformanceController.js',
            'js/controller/CameraController.js',
            'js/controller/AnimationController.js',
            'js/controller/TimelineController.js',
            'js/controller/TextureUpdateController.js',
            'js/controller/TrackingController.js',
            'js/controller/OrientationController.js',
            'js/controller/RendererController.js',
            'js/controller/AssetsController.js',
            'js/controller/InputController.js',
            'js/controller/MouseCursorAppearanceController.js',
            'js/controller/VolumeController.js',
            'js/controller/AnalyticsController.js',
            'js/controller/MouseModeButtonController.js',

            'js/adapter/AssetsAdapter.js',
            'js/adapter/Viewport.js',

            'js/dev/LocalAutoConnectSocket.js',
            'js/dev/PerformanceDebugProfiler.js',

            'js/task/Task.js',
            'js/task/ImagePreloadTask.js',
            'js/task/AssetPreloadTask.js',
            'js/task/SpriteMapPreloadTask.js',
            'js/task/LocalisationInitTask.js',
            'js/task/ClockSyncTask.js',
            'js/task/InitialPreloadTask.js',
            'js/task/MainPreloadTask.js',
            'js/task/LoadAssetsInformation.js',
            'js/task/LoadTimelineInformation.js',
            'js/task/ExperiencePreloadTask.js',
            'js/task/TexturePreloadTask.js',
            'js/task/XHRPreloadTask.js',
            'js/task/SequencePreloadTask.js',
            'js/task/MediaPreloadTask.js',

            'js/model/Model.js',
            'js/model/Resource.js',
            'js/model/FramebufferWrapper.js',
            'js/model/VideoTexture.js',

            'js/view/View.js',
            'js/view/PreloaderView.js',
            'js/view/FooterGoogleView.js',
            'js/view/FooterLinksView.js',
            'js/view/LandingPageView.js',
            'js/view/PersistentControlsView.js',
            'js/view/SetupView.js',
            'js/view/SyncSuccessView.js',
            'js/view/InstructionsView.js',
            'js/view/MouseAllowCameraView.js',
            'js/view/CameraDeniedView.js',
            'js/view/ExperienceLoadingView.js',
            'js/view/ExperienceView.js',
            'js/view/TimelineView.js',
            'js/view/HelpView.js',
            'js/view/HelpView/HelpOrientationView.js',
            'js/view/HelpView/DebugView.js',
            'js/view/EndScreenView.js',
            'js/view/WebcamTipView.js',
            'js/view/PreloaderView.js',
            'js/view/AboutView.js',
            'js/view/WebcamControlView.js',
            'js/multimedia/Player.js',

            'js/view/PlatformNotSupportedView.js',
            'js/view/PerformanceWarningView.js',
            'js/view/DeviceDisconnectedView.js',
            'js/view/RuntimeErrorView.js',

            'js/sequence/Sequence.js',
            'js/sequence/deformmask/DeformMaskSequence.js',
            'js/sequence/opticalfeedback/OpticalFeedbackSequence.js',
            'js/sequence/lanme/LanmeSequence.js',
            'js/sequence/videogrid/VideoGridSequence.js',
            'js/sequence/videogrid/GridPoint.js',
            'js/sequence/feedback/FeedbackSequence.js',
            'js/sequence/zombies/ZombiesSequence.js',
            'js/sequence/mirror/MirrorSequence.js',
            'js/sequence/brokenmirror/BrokenMirrorSequence.js',
            'js/sequence/finale/FinaleSequence.js',
            'js/sequence/axelle/AxelleSequence.js',
            'js/sequence/turnitback/TurnItBackSequence.js',

            'js/main.js'

        ],
        $allJs = $jsLibs.concat(['tmp/templates.js']).concat($jsClasses),
        $jsGlobals = [];

    $jsClasses.forEach(function (url) {

        $jsGlobals.push(url.substring(url.lastIndexOf('/') + 1, url.indexOf('.js')));

    });

    grunt.initConfig({

        LINT_ON_CHANGE: true,

        jshint: {
            gruntfile: ['Gruntfile.js']
        },

        jslint: {
            main: {
                src: [
                    'js/**/*.js'
                ],
                exclude: [
                    'js/lib/**/*.js',
                    'js/dev/**/*.js'
                ],
                options: {
                    errorsOnly: true,
                    failOnError: false,
                    shebang: true
                },
                directives: {

                    bitwise: true,
                    browser: true,
                    node: false,
                    nomen: true,
                    plusplus: true,
                    sloppy: true,
                    predef: $jsGlobals.concat([
                        '$',
                        'Class',
                        'THREE',
                        'console',
                        'Handlebars'
                    ])
                }
            }
        },

        handlebars: {
            templates: {
                options: {
                    namespace: 'Handlebars.templates',
                    processName: function (filename) {
                        return filename.substring(filename.lastIndexOf('/') + 1, filename.indexOf('.'));
                    }
                },
                files: {
                    'tmp/templates.js': ['template/**/*.handlebars']
                }
            }
        },

        concat: {
            options: {
            },
            debug: {
                src: $allJs,
                dest: '../../js/main.js'
            }
        },

        uglify: {
            options: {
            },
            quick: {
                options: {
                    mangle: false,
                    compress: false,
                    beautify: false
                },
                files: {
                    '../../js/main.js': $allJs
                }
            },
            debug: {
                options: {
                    mangle: true,
                    compress: false,
                    beautify: false,
                    sourceMap: '../../js/main.js.map',
                    sourceMapRoot: '/src/desktop/',
                    sourceMappingURL: '/js/main.js.map'
                },
                files: {
                    '../../js/main.js': $allJs
                }
            },
            release: {
                options: {
                    compress: true,
                    beautify: false,
                    sourceMap: '../../js/main.js.map',
                    sourceMapRoot: '/src/desktop/',
                    sourceMappingURL: '/js/main.js.map',
                    report: 'min'
                },
                files: {
                    '../../js/main.js': $allJs
                }
            }
        },

        copy: {
            html: {
                files: [
                    {expand: true, src: ['index.html'], dest: '../..'}
                ]
            },
            js: {
                files: [
                    {expand: true, cwd: 'js/worker/', src: ['**/*.js'], dest: '../../js/worker/'}
                ]
            }
        },

        compass: {
            assets: {
                options: {
                    config: 'config.rb',
                    specify: 'sass/assets.scss'
                }
            },

            styles: {
                options: {
                    config: 'config.rb',
                    specify: 'sass/screen.scss'
                }
            }
        },

        gae: {

            options: {
                application: 'arcade-fire',
                path: '../../../../',
                args: {
                    host: '0.0.0.0'
                }
            },

            start: {
                action: 'run'
            },

            start_async: {
                action: 'run',
                options: {
                    async: true
                }
            },

            stop: {
                action: 'kill'
            }

        },

        watch: {

            grunt: {
                files: ['Gruntfile.js'],
                tasks: ['jshint:gruntfile', 'default'],
                options: {
                    interrupt: true,
                    debounceDelay: 1
                }
            },

            js: {
                files: ['js/**/*.js', '../../../../tailbone/mesh/**/*.js'],
                tasks: ['jslint', 'uglify:debug', 'notify:build-success'],
                options: {
                    spawn: false,
                    interrupt: true,
                    debounceDelay: 1
                }
            },

            html: {
                files: ['index.html'],
                tasks: ['copy:html'],
                options: {
                    interrupt: true,
                    debounceDelay: 1
                }
            },

            templates: {
                files: ['template/**/*.handlebars'],
                tasks: ['handlebars', 'uglify:debug', 'notify:build-success'],
                options: {
                    interrupt: true,
                    debounceDelay: 1
                }
            },

            assets: {
                files: ['../../img/**/**/**/*', 'sass/assets.scss', 'sass/utils/_generate-assets.scss'],
                tasks: ['compass:assets', 'notify:assets-success'],
                options: {
                    interrupt: false,   // has to be false, otherwise the task will keep being interrupted endlessly by images being generated by the task itself
                    debounceDelay: 1
                }
            },

            styles: {
                files: ['sass/**/*.scss'],
                tasks: ['compass:styles', 'notify:styles-success'],
                options: {
                    interrupt: true,
                    debounceDelay: 1
                }
            }

        },

        notify: {

            'build-success': {
                options: {
                    title: 'Success - Build',
                    message: '\'Arcade Fire / Just a Reflektor\' (desktop) build successful.'
                }
            },

            'build-nolint-success': {
                options: {
                    title: 'Success - Build (NO-LINT!)',
                    message: '\'Arcade Fire / Just a Reflektor\' (desktop) build successful. Code has not been linted though, please make sure you lint code before deployment.'
                }
            },

            'styles-success': {
                options: {
                    title: 'Success - Styles Compilation',
                    message: '\'Arcade Fire / Just a Reflektor\' (desktop) SASS stylesheets compiled successfully.'
                }
            },

            'assets-success': {
                options: {
                    title: 'Success - Assets Compilation',
                    message: '\'Arcade Fire / Just a Reflektor\' (desktop) assets compiled successfully.'
                }
            }

        }

    });

    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-gae');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-notify');

    grunt.registerTask('styles', ['compass:styles', 'notify:styles-success']);
    grunt.registerTask('assets', ['compass:assets', 'notify:assets-success']);
    grunt.registerTask('code-fast', ['handlebars', 'uglify:quick', 'copy', 'notify:build-success']);
    grunt.registerTask('code-quick', ['jshint', 'jslint', 'handlebars', 'uglify:quick', 'copy', 'notify:build-success']);
    grunt.registerTask('code-debug', ['jshint', 'jslint', 'handlebars', 'uglify:debug', 'copy', 'notify:build-success']);
    grunt.registerTask('code-release', ['jshint', 'jslint', 'handlebars', 'uglify:release', 'copy', 'notify:build-success']);
    grunt.registerTask('debug', ['jshint', 'jslint', 'handlebars', 'concat', 'compass:styles', 'compass:assets', 'copy', 'notify:build-success']);
    grunt.registerTask('release', ['jshint', 'jslint', 'handlebars', 'uglify:release', 'compass:styles', 'compass:assets', 'copy', 'notify:build-success']);
    grunt.registerTask('default', ['code-quick']);
    grunt.registerTask('start', ['gae:start']);
    grunt.registerTask('start_async', ['gae:start_async']);
    grunt.registerTask('stop', ['gae:stop']);

    grunt.registerTask('watch-quick', function () {
        grunt.config(['watch', 'js', 'tasks'], ['concat', 'notify:build-nolint-success']);
        grunt.task.run('watch');
    });

};