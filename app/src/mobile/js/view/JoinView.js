/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/1/13
 * Time: 7:44 PM
 */

var JoinView = View._extend({

    _static: {

        TIMEOUT: 30000

    },

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        bindEventsShown: function () {

            var self = this;

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_ENTER, function (e, data) {
                self.onPeerEnter(data);
                return e;
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_MESH_EMPTY, function (e, data) {
                self.onMeshEmpty(data);
                return e;
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_MESH_FULL, function (e, data) {
                self.onMeshFull(data);
                return e;
            });

    
        },

        unbind: function () {

            RemoteController.getInstance().events.unbind(RemoteController.EVENT_PEER_ENTER);
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_MESH_FULL);
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_MESH_EMPTY);

        },

        show: function (code) {

            var connectionCode,
                self = this;

            if (!View.prototype.show.call(this)) {
                return;
            }

            this.bindEventsShown();
            connectionCode = code;
            RemoteController.getInstance().join(connectionCode);

            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(function () {
                self.onTimeout();
            }, JoinView.TIMEOUT);

            AnalyticsController.getInstance().trackPageView('JoinView');


        }

    },

    _private: {

        onPeerEnter: function () {

            this.unbind();
            this.hide();
            clearTimeout(this.timeoutId);
            ViewController.getInstance().getView('SyncSuccessView').show();

        },

        onMeshEmpty: function () {

            this.unbind();
            this.hide();
            clearTimeout(this.timeoutId);
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SYNC_WRONG_CODE);
            ViewController.getInstance().getView('ExperienceEmptyView').show();

        },

        onMeshFull: function () {

            this.unbind();
            this.hide();
            clearTimeout(this.timeoutId);
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SYNC_FULL);
            ViewController.getInstance().getView('ExperienceFullView').show();

        },

        onTimeout: function () {

            this.unbind();
            this.hide();
            clearTimeout(this.timeoutId);
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SYNC_TIMEOUT);
            ViewController.getInstance().getView('ConnectionTimeoutView').show();

        }

    }

});
