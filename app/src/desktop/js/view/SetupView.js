/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:22 PM
 */

var SetupView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        init: function () {

            this.$instructions = this.$container.find('.instructions');
            this.$instructions.html(this.$instructions.html().replace('{{url}}', '<span>' + Config.getInstance().mobileConnectionUrl.replace('http://', '').replace('https://', '') + '</span>'));
            this.$instructions.html(this.$instructions.html().replace('{{code}}', '<span class="code"></span>'));

            this.$code = this.$container.find('.code');

        },

        bindEventsShown: function () {

            var self = this;

            RemoteController.getInstance().events.bind(RemoteController.EVENT_CONNECTION_CODE_READY, function (event, data) {
                self.onConnectionCodeReady(data);
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_ENTER + '.SetupView', function (event, data) {
                self.onPeerEnter(data);
            });

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            this.bindEventsShown();
            this.$code.hide();
            RemoteController.getInstance().host();
            TrackingController.getInstance().start();
            InputController.getInstance().setMode(InputController.INPUT_TYPE_TRACKING);
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SYNC_START);
            AnalyticsController.getInstance().trackPageView('SetupView');

            //Player.getInstance().startPreloadingVideo();

        }

    },

    _private: {

        $instructions: null,
        $code: null,

        onConnectionCodeReady: function (code) {

            var self = this;
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_CONNECTION_CODE_READY);

            setTimeout(function () {
                self.$code.fadeIn();
            }, 1);

            this.$code.text(code);

        },

        onPeerEnter: function () {

            RemoteController.getInstance().events.unbind(RemoteController.EVENT_PEER_ENTER + '.SetupView');
            this.hide();
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SYNC_SUCCESS);
            ViewController.getInstance().getView('HelpView').hide();
            ViewController.getInstance().getView('SyncSuccessView').show();

        }

    }

});
