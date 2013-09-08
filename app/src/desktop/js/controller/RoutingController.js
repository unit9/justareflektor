/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/28/13
 * Time: 3:31 PM
 */

var RoutingController = RoutingControllerBase._extend(Class.SINGLETON, {

    _static: {

        ROUTES: [

            {base: '^\\/$', handler: 'routeHome'},
            {base: '^\\/instructions(\\/)?$', handler: 'routeInstructions', trigger: '/', back: '/'},
            {base: '^\\/mousecamera(\\/)?$', handler: 'routeMouseCamera', trigger: '/', back: '/'},
            {base: '^\\/cameradenied(\\/)?$', handler: 'routeCameraDenied', trigger: '/', back: '/'},
            {base: '^\\/setup(\\/)?$', handler: 'routeSetup', trigger: '/', back: '/'},
            {base: '^\\/experience-loading(\\/)?$', handler: 'routeExperienceLoading', trigger: '/', back: '/'},
            {base: '^\\/experience(\\/)?$', handler: 'routeExperience', back: '/'},
            {base: '^\\/disconnected(\\/)?$', handler: 'routeDisconnected', trigger: '/', back: '/'},
            {base: '^\\/error(\\/)?$', handler: 'routeError', trigger: '/', back: '/'},
            {base: '^\\/end(\\/)?$', handler: 'routeEndScreen', preventDefault: false, firstRoute: 'routeExperience', trigger: '/'},
            {base: '^\\/about(\\/)?$', handler: 'routeAbout', preventDefault: true, firstRoute: 'routeHome'},

            /* special */
            {base: '__back__', handler: 'back', trigger: false}

        ]

    },

    _public: {

        historyStates: [],
        history: [],
        enabled: false,

        construct: function () {

            RoutingControllerBase.call(this, RoutingController.ROUTES);

            // Arabic rtl helper
	        View.registerHelper(function () {
		        var dir = i18n.lng().toLowerCase().indexOf('ar') === 0 ? 'rtl' : 'ltr';
		        this.$container.find('bdo').each(function () {
			        if($(this).attr('dir') == 'ltr') {
				        var str = $(this).text().split('').reverse().join('');  // invert chars in eng words
				        $(this).replaceWith(str);                               // replace bdo with plain text
			        }
			        else
				        $(this).attr('dir', dir);
		        });
		        // redraw so that chrome can render text as one string
		        // (after replacing dom el with string, chrome treats it as separated string and that causes a render bug)
		        if(dir == 'rtl') {
			        this.$container.find('bdo').each(function () {
				        $(this).html($(this).html());
			        });
		        }
	        }, true);

            // links helper
            View.registerHelper(function () {

                this.$container.find('.link').each(function () {
                    var $this = $(this);
                    $this.off('click');
                    if ($this.hasClass('route')) {
                        $this.bind('click', function () {
                            RoutingController.getInstance().route($this.data('route'), $this.hasClass('trigger') ? {trigger: true} : null);
                        });
                    } else {
                        $this.bind('click', function () {
                            window.open($this.data('url'), $this.hasClass('external') ? '_blank' : '_self');
                        });
                    }

                });

            });

            // mouse control helper
            View.registerHelper(function () {
                this.$container.find('.link.mouse-mode a').each(function () {
                    var $this = $(this);
                    $this.off('click').bind('click', function () {
                        InputController.getInstance().setMode(InputController.INPUT_TYPE_MOUSE);
                        if (ViewController.getInstance().getView('ExperienceLoadingView').shown) {
                            ViewController.getInstance().getView('ExperienceLoadingView').onMouseMode();
                        } else {
                            RoutingController.getInstance().route('/experience-loading');
                        }
                    });
                });
            });

            ViewController.getInstance().init({

                'section.PreloaderView': { id: 'PreloaderView', Class: PreloaderView },
                'section.LandingPageView': { id: 'LandingPageView', Class: LandingPageView },
                'section.SetupView': { id: 'SetupView', Class: SetupView },
                'section.SyncSuccessView': { id: 'SyncSuccessView', Class: SyncSuccessView },
                'section.InstructionsView': { id: 'InstructionsView', Class: InstructionsView },
                'section.MouseAllowCameraView': { id: 'MouseAllowCameraView', Class: MouseAllowCameraView },
                'section.CameraDeniedView': { id: 'CameraDeniedView', Class: CameraDeniedView },
                'section.ExperienceLoadingView': { id: 'ExperienceLoadingView', Class: ExperienceLoadingView },
                'section.ExperienceView': { id: 'ExperienceView', Class: ExperienceView },
                'section.EndScreenView': { id: 'EndScreenView', Class: EndScreenView },
                'nav.TimelineView': { id: 'TimelineView', Class: TimelineView },
                'section.HelpView': { id: 'HelpView', Class: HelpView },
                'section.PerformanceWarningView': { id: 'PerformanceWarningView', Class: PerformanceWarningView },
                'header.PersistentControlsView': { id: 'PersistentControlsView', Class: PersistentControlsView },
                'footer.FooterGoogleView': { id: 'FooterGoogleView', Class: FooterGoogleView },
                'footer.FooterLinksView': { id: 'FooterLinksView', Class: FooterLinksView },
                'section.AboutView': { id: 'AboutView', Class: AboutView },
                'div.WebcamTipView': { id: 'WebcamTipView', Class: WebcamTipView },
                'section.PlatformNotSupportedView': { id: 'PlatformNotSupportedView', Class: PlatformNotSupportedView },
                'section.DeviceDisconnectedView': { id: 'DeviceDisconnectedView', Class: DeviceDisconnectedView },
                'section.RuntimeErrorView': { id: 'RuntimeErrorView', Class: RuntimeErrorView }

            });

            this.bindExceptionViews();
            this.init();

        },

        bindExceptionViews: function () {

            var self = this;

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_LEAVE, function () {

                if (TimelineController.getInstance().canShowDisconnectionError()) {
                    ViewController.getInstance().getView('TimelineView').slideOut();
                    ViewController.getInstance().getView('DeviceDisconnectedView').show(true);
                }

            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_MESH_CLOSE, function () {
                RoutingController.getInstance().route('/error');
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_EXPERIENCE_RESTART, function () {
                self.route('/experience');

                TimelineController.getInstance().stop();
                TimelineController.getInstance().start();
            });

        },

        routeInitial: function () {
            var supportInfo = DetectionController.getInstance().getSupportInfo();

            this.checkDebugFlags();

            RoutingControllerBase.prototype.routeInitial.call(this);

            if (!supportInfo.supported && DetectionController.getInstance().isChrome) {
                this.routeNotSupported(supportInfo);

                return;
            }

            this.routePreloader();
        },

        checkDebugFlags: function () {

            if(window.location.href.match(/experience/g) != null) {
                TimelineController.DIRECT_FLAG = true;
            }

        },

        routeDefault: function () {

            RoutingControllerBase.prototype.routeDefault.call(this);

            /*
             Hide all views. Subsequent calls to show() will cancel the hide() action on views that should persist.
             */
            ViewController.getInstance().getView('LandingPageView').hide();
            ViewController.getInstance().getView('SetupView').hide();
            ViewController.getInstance().getView('SyncSuccessView').hide();
            ViewController.getInstance().getView('InstructionsView').hide();
            ViewController.getInstance().getView('MouseAllowCameraView').hide();
            ViewController.getInstance().getView('CameraDeniedView').hide();
            ViewController.getInstance().getView('ExperienceLoadingView').hide();
            ViewController.getInstance().getView('ExperienceView').hide();
            ViewController.getInstance().getView('TimelineView').hide();
            ViewController.getInstance().getView('PerformanceWarningView').hide();
            ViewController.getInstance().getView('HelpView').hide();
            ViewController.getInstance().getView('PersistentControlsView').hide();
            ViewController.getInstance().getView('FooterGoogleView').hide();
            ViewController.getInstance().getView('FooterLinksView').hide();
            ViewController.getInstance().getView('ExperienceView').hide();
            ViewController.getInstance().getView('EndScreenView').hide();
            ViewController.getInstance().getView('AboutView').hide();
            ViewController.getInstance().getView('DeviceDisconnectedView').hide();
            ViewController.getInstance().getView('RuntimeErrorView').hide();

        },

        routeNotSupported: function (supportInfo) {

            ViewController.getInstance().getView('PreloaderView').hide();
            ViewController.getInstance().getView('PlatformNotSupportedView').show(supportInfo);

        },

        routePreloader: function () {

            ViewController.getInstance().getView('PreloaderView').show();

        },

        routeHome: function () {

            if (!this.enabled) {
                return;
            }

            ViewController.getInstance().getView('LandingPageView').show();
            ViewController.getInstance().getView('FooterGoogleView').show();
            ViewController.getInstance().getView('FooterLinksView').show();

        },

        routeInstructions: function () {

            ViewController.getInstance().getView('InstructionsView').show();
            ViewController.getInstance().getView('PersistentControlsView').show();

        },

        routeMouseCamera: function () {

            ViewController.getInstance().getView('MouseAllowCameraView').show();
            ViewController.getInstance().getView('PersistentControlsView').show();

        },

        routeCameraDenied: function () {

            ViewController.getInstance().getView('CameraDeniedView').show();

        },

        routeSetup: function () {

            ViewController.getInstance().getView('SetupView').show();
            ViewController.getInstance().getView('PersistentControlsView').show();

        },

        routeExperienceLoading: function () {

            ViewController.getInstance().getView('ExperienceLoadingView').show();
            ViewController.getInstance().getView('PersistentControlsView').show();

        },

        routeExperience: function () {

            ViewController.getInstance().getView('ExperienceView').show();
            ViewController.getInstance().getView('PersistentControlsView').show();
            ViewController.getInstance().getView('TimelineView').show();

        },

        routeEndScreen: function () {

            ViewController.getInstance().getView('EndScreenView').show();

        },

        routeDisconnected: function () {

            ViewController.getInstance().getView('DeviceDisconnectedView').show();
        },

        routeError: function () {

            ViewController.getInstance().getView('RuntimeErrorView').show();
        },

        routeAbout: function () {

            ViewController.getInstance().getView('AboutView').show();

        }

    }

});
