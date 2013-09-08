var VolumeController = Class._extend(Class.SINGLETON, {

    _static:  {

        VOLUMNE: 60, // as default, in percent
        VOLUME_RANGE: { min : 20, max: 90 },

        EVENT_VOLUME_CHANGE_REQUEST: "VolumeController_EVENT_VOLUME_CHANGE_REQUEST",    // ui > controller
        EVENT_VOLUME_CHANGE:         "VolumeController_EVENT_VOLUME_CHANGE",            // controller > ui

        EVENT_CHANGE:                "VolumeController_EVENT_CHANGE"                    // global

    },

    _public: {

        // TODO: smooth easing, range 

        construct: function () {

            var self = this;

            self.volumeWorkingRange = VolumeController.VOLUME_RANGE.max - VolumeController.VOLUME_RANGE.min;
            self.currentVolume = VolumeController.VOLUME_RANGE.min + VolumeController.VOLUME * self.volumeWorkingRange;

        }

    },

    _private: {

        currentVolume: -1,
        targetVolume: -1,
        volumeWorkingRange: -1,

        uiBarActive: true,

        setVolume: function (newVolumePercent, ui) {

            if(newVolumePercent<0) newVolumePercent=0;
            if(newVolumePercent>100) newVolumePercent=100;

            VolumeController.VOLUME = newVolumePercent;
            self.currentVolume = VolumeController.VOLUME_RANGE.min + VolumeController.VOLUME * self.volumeWorkingRange;

            if(!ui) this.events.trigger(VolumeController.EVENT_VOLUME_CHANGE,[{volume: VolumeController.VOLUME }]);

            this.events.trigger(VolumeController.EVENT_CHANGE, [{volume: VolumeController.VOLUME }]);
        }

    }

});
