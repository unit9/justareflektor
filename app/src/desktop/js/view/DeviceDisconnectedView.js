/**
 * @author Maciej Zasada maciej@unit9.com
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:22 PM
 */

var DeviceDisconnectedView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function (waitForReconnect) {

            if (!View.prototype.show.call(this, waitForReconnect)) {
                return;
            }

            this.$connected.stop().hide();
            this.$disconnected.stop().show();

            if (waitForReconnect) {

                this.experienceWasPlaying = TimelineController.getInstance().running;
                TimelineController.getInstance().pause();
                RemoteController.getInstance().pause();
                ViewController.getInstance().getView('ExperienceLoadingView').pause();
                ViewController.getInstance().getView('TimelineView').slideOut();
                OrientationController.getInstance().resetResetInformation();
                this.bindEventsReconnect();
                this.$container.addClass('reconnect');
                this.$code.text(RemoteController.getInstance().mesh.id);

            } else {

                this.$container.removeClass('reconnect');
                TimelineController.getInstance().stop();

            }

            AnalyticsController.getInstance().trackPageView('DeviceDisconnectedView');

        },

        hide: function () {

            View.prototype.hide.call(this);
            this.unbindEventsReconnect();

        }

    },

    _private: {

        $buttonMouseMode: null,
        $disconnected: null,
        $connected: null,
        $code: null,
        experienceWasPlaying: false,

        init: function () {

            this.$buttonMouseMode = this.$container.find('.link.mouse-mode a');
            this.$disconnected = this.$container.find('.disconnected');
            this.$connected = this.$container.find('.connected');
            this.$code = this.$container.find('.code');

        },

        bindEvents: function () {

            var self = this;

            this.$buttonMouseMode.unbind('click').bind('click', function () {
                self.onMouseMode();
            });

            return;

        },

        bindEventsReconnect: function () {

            var self = this;

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_ENTER + '.DeviceDisconnectedView', function () {
                self.onPeerEnter();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_LEAVE + '.DeviceDisconnectedView', function () {
                self.onPeerLeave();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_READY + '.DeviceDisconnectedView', function () {
                self.onPeerReady();
            });

        },

        unbindEventsReconnect: function () {

            RemoteController.getInstance().events.unbind(RemoteController.EVENT_PEER_ENTER + '.DeviceDisconnectedView');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_PEER_LEAVE + '.DeviceDisconnectedView');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_PEER_READY + '.DeviceDisconnectedView');

        },

        onPeerEnter: function () {

            this.$disconnected.stop().fadeOut();
            this.$connected.stop().fadeIn();

        },

        onPeerLeave: function () {

            this.$disconnected.stop().fadeIn();
            this.$connected.stop().fadeOut();

        },

        onPeerReady: function () {

            this.hide();
            if (ViewController.getInstance().getView('ExperienceLoadingView').shown) {
                ViewController.getInstance().getView('ExperienceLoadingView').resume();
            } else if (this.experienceWasPlaying) {
                TimelineController.getInstance().resume();
            }

        },

        onMouseMode: function () {

            InputController.getInstance().setMode(InputController.INPUT_TYPE_MOUSE);
            if (ViewController.getInstance().getView('ExperienceLoadingView').shown) {
                ViewController.getInstance().getView('ExperienceLoadingView').onMouseMode();
            } else {
                ViewController.getInstance().getView('ExperienceView').onDeviceActive();
            }

            this.onPeerReady();

        }

    }

});
