/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:44 PM
 */

var RoutingController = RoutingControllerBase._extend(Class.SINGLETON, {

    _static: {

        BASE_URL: '/m',

        ROUTES: [

            {base: '^\\/$', handler: 'routeLandingPage'},
            {base: '^\\/controller(\\/)?$', handler: 'routeController'},
            {base: '^\\/disconnected(\\/)?$', handler: 'routeDisconnected'},
            {base: '^\\/end(\\/)?$', handler: 'routeEnd'},
            {base: '^\\/about(\\/)?$', handler: 'routeAbout'},

            /* special */
            {base: '__back__', handler: 'back', trigger: false}

        ]

    },

    _public: {

        enabled: false,

        construct: function () {

            RoutingControllerBase.call(this, RoutingController.ROUTES, RoutingController.BASE_URL);

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

            ViewController.getInstance().init({

                'section.PreloaderView': { id: 'PreloaderView', Class: PreloaderView },
                'section.LandingPageView': { id: 'LandingPageView', Class: LandingPageView },
                'section.JoinView': { id: 'JoinView', Class: JoinView },
                'section.ExperienceEmptyView': { id: 'ExperienceEmptyView', Class: ExperienceEmptyView },
                'section.ExperienceFullView': { id: 'ExperienceFullView', Class: ExperienceFullView },
                'section.ConnectionTimeoutView': { id: 'ConnectionTimeoutView', Class: ConnectionTimeoutView },
                'section.SyncSuccessView': { id: 'SyncSuccessView', Class: SyncSuccessView },
                'section.ExperienceLoadingView': { id: 'ExperienceLoadingView', Class: ExperienceLoadingView },
                'section.DisconnectedView': { id: 'DisconnectedView', Class: DisconnectedView },
                'section.TouchButtonView': { id: 'TouchButtonView', Class: TouchButtonView },
                'section.ControllerView': { id: 'ControllerView', Class: ControllerView },
                'section.EndScreenView': { id: 'EndScreenView', Class: EndScreenView },
                'section.AboutView': { id: 'AboutView', Class: AboutView },

                'section.AxelleVideoView': { id: 'AxelleVideoView', Class: AxelleVideoView },
                'section.TurnItBackView': { id: 'TurnItBackView', Class: TurnItBackView },

                'section.PlatformNotSupportedView': { id: 'PlatformNotSupportedView', Class: PlatformNotSupportedView }

            });

            this.bindExceptionViews();
            this.init();

        },

        bindExceptionViews: function () {

            var self = this;

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_LEAVE, function () {
                window.location.href = '/m/disconnected';
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_MESH_CLOSE, function () {
                window.location.href = '/m/disconnected';
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_EXPERIENCE_END, function () {
                self.route('/end');
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_EXPERIENCE_RESTART, function () {
                if (!ViewController.getInstance().getView('ControllerView').shown) {
                    self.route('/controller');
                }
            });


        },

        routeInitial: function () {

            var supportInfo = DetectionController.getInstance().getSupportInfo();

            RoutingControllerBase.prototype.routeInitial.call(this);
            $('.code-loader').remove();

            if (!supportInfo.supported) {

                this.routeNotSupported(supportInfo);
                return false;

            }

            //Avoid routing from mobile to desktop because js may fail to identify a mobile device 
            //if (DetectionController.getInstance().platform === DetectionController.PLATFORM_DESKTOP && !DetectionController.getInstance().isDebug) {
            //
            //    this.routeDesktop();
            //    return false;
            //
            //}

            this.routePreloader();
            return true;

        },

        routeDefault: function () {

            /*
             Hide all views. Subsequent calls to show() will cancel the hide() action on views that should persist.
             */
            ViewController.getInstance().getView('LandingPageView').hide();
            ViewController.getInstance().getView('JoinView').hide();
            ViewController.getInstance().getView('ExperienceEmptyView').hide();
            ViewController.getInstance().getView('ExperienceFullView').hide();
            ViewController.getInstance().getView('ConnectionTimeoutView').hide();
            ViewController.getInstance().getView('SyncSuccessView').hide();
            ViewController.getInstance().getView('ExperienceLoadingView').hide();
            ViewController.getInstance().getView('DisconnectedView').hide();
            ViewController.getInstance().getView('ControllerView').hide();
            ViewController.getInstance().getView('TouchButtonView').hide();
            ViewController.getInstance().getView('EndScreenView').hide();
            ViewController.getInstance().getView('AxelleVideoView').hide();
            ViewController.getInstance().getView('TurnItBackView').hide();
            ViewController.getInstance().getView('PlatformNotSupportedView').hide();
            ViewController.getInstance().getView('AboutView').hide();

        },

        routeDesktop: function () {

            window.location.href = '/';

        },

        routeNotSupported: function (supportInfo) {

            ViewController.getInstance().getView('PlatformNotSupportedView').show(supportInfo);

        },

        routePreloader: function () {

            ViewController.getInstance().getView('PreloaderView').show();

        },

        routeLandingPage: function () {

            if (!this.enabled) {
                return;
            }

            ViewController.getInstance().getView('LandingPageView').show();

        },

        routeController: function () {


            ViewController.getInstance().getView('ControllerView').show();

        },

        routeDisconnected: function () {

            MobileController.getInstance().enableMagnifyingGlass();
            MobileController.getInstance().allowSleepIos();
            ViewController.getInstance().getView('DisconnectedView').show();

        },

        routeEnd: function () {

            MobileController.getInstance().enableMagnifyingGlass();
            ViewController.getInstance().getView('EndScreenView').show();

        },

        routeAbout: function () {

            MobileController.getInstance().enableMagnifyingGlass();
            ViewController.getInstance().getView('AboutView').show();

        }


    }

});
