/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 * @author Maciej Zasada maciej@unit9.com
 *
 */
var Player = Class._extend(Class.SINGLETON, {

    _static: {

        AV_RESYNC_ENABLED: false,
        AUDIO_VIDEO_SEPARATE: false,
        MIN_BUFFER_TO_PLAY: 0.1,
        REQUIRE_MIN_BUFFER_FOR_READY: false,
        DEFAULT_TOLERANCE: 4 / 24,
        MAX_RESYNC_DELAY_COUNT: 10,
        MIN_OFFSET_FRAMES_TO_RESYNC: 10,
        EVENT_LOADING_PROGRESS: 'Player_Event_Loading_Progress',
        EVENT_LOADING_READY: 'Player_Event_Loading_Ready',
        EVENT_ENDED: 'Player_Event_Ended',
        EVENT_SEEK_START: 'Player_event_SEEK_START',
        EVENT_SEEKED: 'Player_event_Seeked',
        EVENT_QUALITY_CHANGE: 'Player_EVENT_QUALITY_CHANGE',
        SEEKABLE_PROPERTY: 'seekable',
        VIDEO_FRAMERATE: 23.976,
        MAX_TIME_WAITING: 2000,
        MAX_NUM_WAITING: 4,
        
        EVENT_CONNECTING_MESSAGE_SHOW: "Player_EVENT_CONNECTING_MESSAGE_SHOW",
        EVENT_CONNECTING_MESSAGE_HIDE: "Player_EVENT_CONNECTING_MESSAGE_HIDE"


    },

    _public: {

        //elements
        audio: null,
        video: null,

        // debug
        url: '',
        readyToPlay: 'false',
        currentTime: 0.00001,
        bufferTime: 0.00001,
        buffer: 0.00001,
        canPlayThrough: 'false',

        //loading
        ready: false,
        videoUrl: null,
        audioUrl: null,
        videoWidth: 1280,
        videoHeight: 672,
        videoLoadReady: false,
        audioLoadReady: false,
        loadStarted: false,
        forcePlayAfterSeek: false,
        pauseOnTimeUpdate: true,
        forcedResolution: false,

        //status
        volume: 1,
        tolerance: 4 / 24,
        playing: false,
        seeking: false,
        videoSeekTime: 0,
        quality: 0,
        qualityChanged: false,
        qualityChangeVideoTime: 0,
        resyncingVideoCurrentTime: 0,
        resyncStartTime: 0,
        resyncDelays: [],
        resyncStartDifference: 0,
        resyncDifferences: [0.15], //default value 0.15
        offsetFramesCount: 0,
        lastFrameTime: -1,
        waitStartTime: -1,
        waiting: false,
        blocked: false,
        numWaiting: 0,

        // debug
        seekStartTime: 0,

        construct: function () {

            this.volume = 1;

        },

        init: function (audioPath, tolerance) {

            var self = this;

            this.tolerance = tolerance || Player.DEFAULT_TOLERANCE;

            this.video = document.createElement('video');
            this.ready = false;

            if (Player.AUDIO_VIDEO_SEPARATE) {
                this.audio = document.createElement('audio');
                this.audioUrl = audioPath;
            }

            if (MediaPreloadTask.VIDEOS_USE_RESOURCE || Config.getInstance()._class === ConfigLocal || window.location.host.indexOf('test2') !== -1) {
                this.video.setAttribute('crossOrigin', 'anonymous');
                if (this.audio) {
                    this.audio.setAttribute('crossOrigin', 'anonymous');
                }
            }

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME, function () {
                self.onFrame();
            });

            Debug.add(this, 'url', 'Video');
            Debug.add(this, 'readyToPlay', 'Video');
            Debug.add(this, 'canPlayThrough', 'Video');
            Debug.add(this, 'currentTime', 'Video');
            Debug.add(this, 'bufferTime', 'Video');
            Debug.add(this, 'buffer', 'Video');

            this.bindEvents();

        },

        setVideoSize: function(width, height) {
            this.videoWidth = width;
            this.videoHeight = height;
        },

        setQuality: function (width) {

            var i;

            var overwriteWidth = parseInt(this.getQueryVariable('res'));
            if (overwriteWidth > 0) {
                width = overwriteWidth;
                this.quality = width;
                this.forcedResolution = true;
                this.setVideoUrl('/media/video/' + width + '/reflektor_full_audio.webm');
            }

            if (this.quality === width) {
                return;
            }

            for (i = 0; i < MediaPreloadTask.VIDEOS.length; ++i) {

                if (MediaPreloadTask.VIDEOS[i].resolution.width === width) {
                    this.quality = width;
                    this.setVideoUrl(MediaPreloadTask.VIDEOS[i].path);
                    this.events.trigger(Player.EVENT_QUALITY_CHANGE);
                    break;
                }

            }

        },

        switchToLowerQuality: function () {

            var i;

            for (i = MediaPreloadTask.VIDEOS.length - 1; i > -1; --i) {
                if (MediaPreloadTask.VIDEOS[i].resolution.width < this.quality) {
                    console.log('-- SWITCHING TO LOWER QUALITY: ', MediaPreloadTask.VIDEOS[i].resolution.width, '--');
                    this.setQuality(MediaPreloadTask.VIDEOS[i].resolution.width);
                    return true;
                }
            }

            console.log('-- NO LOWER QUALITY --');
            return false;

        },

        setVideoUrl: function (url) {

            var videoPath = url;

            if (Config.getInstance()._class === ConfigLocal) {
                videoPath = Resource.get(videoPath.replace('_audio', ''));
            } else if (this.getQueryVariable('lightversion')) {
                videoPath = Resource.get('media/videos/1280/reflektor_full_light.webm');
            } else {
                if (!MediaPreloadTask.VIDEOS_WITH_AUDIO || window.location.host.indexOf('test2') !== -1) {
                    videoPath = videoPath.replace('_audio', '');
                }
                if (MediaPreloadTask.VIDEOS_USE_RESOURCE || window.location.host.indexOf('test2') !== -1) {
                    videoPath = Resource.get(videoPath);
                }
            }

            this.videoUrl = videoPath;
            this.url = this.videoUrl.substring(this.videoUrl.indexOf('video/') + 'video/'.length);

            if (this.video) {

                if (this.video.src) {
                    this.qualityChanged = true;
                    this.qualityChangeVideoTime = this.video && this.video.src ? this.video.currentTime : 0;
                    this.events.trigger(Player.EVENT_CONNECTING_MESSAGE_SHOW, [true]);
                }

                this.video.src = videoPath;

                console.log('[video] url:', videoPath);

            }

        },

        startPreloadingVideo: function (forceLowResolution) {

            var optimalVideo,
                audioPath;

            if (this.videoPreloaded) {
                return;
            }
            this.videoPreloaded = true;

            if (Config.getInstance()._class === ConfigLocal) {
                audioPath = Resource.get('/audio/local.mp3');
            } else {
                audioPath = window.location.host.indexOf('test2') === -1 ? ('/audio/reflektor.mp3') : Resource.get('/media/audio/audio2_sd.mp3');
            }

            this.init(audioPath);
            optimalVideo = this.getOptimalVideo(forceLowResolution);
            this.setQuality(optimalVideo.resolution.width); // TODO: this bugs sometimes, optimalVideo is undefined.
            this.setVideoSize(optimalVideo.resolution.width, optimalVideo.resolution.height);
            this.load();

            Debug.openFolder('Video');

        },

        getOptimalVideo: function (forceLowResolution) {

            var optimal = MediaPreloadTask.VIDEOS[MediaPreloadTask.VIDEO_LOWRES_VERSION],
                maxQuality = PerformanceController.getInstance().determineOptimalVideoQuality(),
                i;

            if (forceLowResolution) {
                console.log('WebGL Performance is forcing a low resolution');
                for (i = 0; i < MediaPreloadTask.VIDEOS.length; i++) {
                    if (MediaPreloadTask.VIDEOS[i].resolution.width === 640) {
                        return MediaPreloadTask.VIDEOS[i];
                    }
                }
            }

            for (i = 1; i < MediaPreloadTask.VIDEOS.length; ++i) {

                if (maxQuality.size >= MediaPreloadTask.VIDEOS[i].size && maxQuality.resolution.width >= MediaPreloadTask.VIDEOS[i].resolution.width && maxQuality.resolution.height >= MediaPreloadTask.VIDEOS[i].resolution.height) {

                    optimal = MediaPreloadTask.VIDEOS[i];

                } else {

                    break;

                }

            }

            return optimal;

        },

        getQueryVariable: function (variable) {
            var query = window.location.search.substring(1);
            var vars = query.split('&');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (pair[0] == variable) {
                    return pair[1];
                }
            }
            return false;
        },

        load: function () {

            if (this.loadStarted) {
                throw new Error('Error: Trying to start loading Audio & Video twice.');
            }

            console.log('-- videoUrl: ', this.videoUrl);
            this.video.src = this.videoUrl;
            this.video.load();
            this.video.volume = 0;
            this.video.play();

            if (Player.AUDIO_VIDEO_SEPARATE) {

                this.audio.src = this.audioUrl;
                this.audio.load();
                this.audio.volume = 0;
                this.audio.play();
                $('.preload').append(this.audio);

            }

            this.pauseOnTimeUpdate = true;
            this.loadStarted = true;

            $('.preload').append(this.video);

        },


        /*
         *
         * Playback Controls
         *
         */
        play: function (noresync) {

            if (this.playing || !this.video) {
                return;
            }

            this.playing = true;
            this.pauseOnTimeUpdate = false;

            this.video.volume = this.volume;
            if (this.audio) {
                this.audio.volume = this.volume;
            }

            clearTimeout(this.resyncTimeoutId);
            if (noresync) {
                this.video.play();
                if (this.audio) {
                    this.audio.play();
                }
                RemoteController.getInstance().play();
            } else {
                this.seek(this.getCurrentTime() < 1.5 ? 0 : this.getCurrentTime());
            }
        },

        pause: function () {

            if (this.video) {

                this.playing = false;
                this.forcePlayAfterSeek = false;
                this.video.pause();

                if (this.audio) {
                    this.audio.pause();
                }

                clearTimeout(this.resyncTimeoutId);
                RemoteController.getInstance().pause();
            }

        },

        seek: function (ct) {

            if (this.video) {

                this.seekStartTime = window.performance.now();

                ct = this.getMaxSeekTime(ct);
                if (this.playing) {
                    this.pause();
                    this.forcePlayAfterSeek = true;
                }
                clearTimeout(this.resyncTimeoutId);
                this.events.trigger(Player.EVENT_SEEK_START);
                this.videoSeekTime = this.video.currentTime;
                try {
                    this.video.currentTime = ct;
                } catch (e) {
                    console.debug('video seek exception');
                }
                if (this.audio) {
                    this.audio.currentTime = ct;
                }
                this.seeking = true;

                this.events.trigger(Player.EVENT_CONNECTING_MESSAGE_SHOW, [true]);
            }

        },


        /*
         *
         * Get progress and status
         *
         */
        getCurrentTime: function () {
            return this.audio ? this.audio.currentTime : (this.video ? this.video.currentTime : 0);
        },

        getDuration: function () {
            return this.audio ? this.audio.duration : (this.video ? this.video.duration : 1);
        },

        getProgress: function () {
            return this.getCurrentTime() / this.getDuration();
        },

        getBufferedAudio: function () {
            if (!this.audio) {
                return 99999999;
            }
            return this.getMaxSeekTimeForMedia(this.audio, 9999999) / this.audio.duration;
        },

        getBufferedVideo: function () {
            if (!this.video) {
                return 0.0;
            }
            return this.getMaxSeekTimeForMedia(this.video, 9999999) / this.video.duration;
        },

        getBuffered: function () {

            return Math.min(this.getBufferedAudio(), this.getBufferedVideo());

        },

        getBufferRanges: function () {

            var ranges = [],
                i,
                j,
                start,
                end;

            if (!this.video) {
                return ranges;
            }

            for (i = 0; i < this.video.buffered.length; ++i) {

                start = this.video.buffered.start(i);
                end = this.video.buffered.end(i);

                if (this.audio) {

                    for (j = 0; j < this.audio.buffered.length; ++j) {

                        if (this.audio.buffered.end(j) >= start && this.audio.buffered.start(j) <= end) {

                            ranges.push({start: Math.max(this.audio.buffered.start(j), start) / this.video.duration, end: Math.min(this.audio.buffered.end(j), end) / this.video.duration});

                        }

                    }

                } else {

                    ranges.push({start: start / this.video.duration, end: end / this.video.duration});

                }

            }

            return ranges;

        },

        getCurrentTimeVideo: function () {
            if (!this.video) {
                return 0;
            }
            if (this.video.seeking) {
                return this.videoSeekTime;
            }
            return this.video.currentTime;
        },

        getCurrentFrame: function () {
            if (!this.video) {
                return 0;
            }
            return Math.floor(this.video.currentTime * Player.VIDEO_FRAMERATE);
        },

        getSeekableRange: function () {
            return this.audio ? Math.min(this.video.seekable.end(0), this.audio.seekable.end(0)) : this.video.seekable.end(0);
        },

        setVolume: function (volume) {

            this.volume = volume;
            if (!this.pauseOnTimeUpdate) {
                this.video.volume = volume;
                if (this.audio) {
                    this.audio.volume = volume;
                }
            }
            RemoteController.getInstance().setVolume(volume);

        }

    },


    _protected: {

        resync: false,
        resyncTimeoutId: -1,
        videoPreloaded: false,

        bindEvents: function () {

            var self = this;

            this.video.addEventListener('canplaythrough', function (e) {
                self.loadReadyVideo(e);
            }, false);
            this.video.addEventListener('progress', function (e) {
                self.loadProgress(e);
            }, false);

            this.video.addEventListener('timeupdate', function (e) {
                self.timeUpdate(); //force time update check when resyncing
            }, false);

            this.video.addEventListener('error', function (e) {
                console.error(e);
            }, false);

            this.video.addEventListener('seeked', function (e) {
                self.onSeekComplete();
            }, false);

            this.video.addEventListener('waiting', function (e) {
                self.onWaiting();
            }, false);

            this.video.addEventListener('ended', function (e) {
                self.events.trigger(Player.EVENT_ENDED);
            }, false);

            if (this.audio) {
                this.audio.addEventListener('timeupdate', function (e) {
                    self.timeUpdate(e);
                }, false);
                this.audio.addEventListener('canplaythrough', function (e) {
                    self.loadReadyAudio(e);
                }, false);
                this.audio.addEventListener('progress', function (e) {
                    self.loadProgress(e);
                }, false);

                this.audio.addEventListener('seeked', function (e) {
                    self.onSeekComplete();
                }, false);

                this.audio.addEventListener('error', function (e) {
                    switch (e.target.error.code) {
                        case e.target.error.MEDIA_ERR_ABORTED:
                            console.error('You aborted the audio playback.');
                            break;
                        case e.target.error.MEDIA_ERR_NETWORK:
                            console.error('A network error caused the audio download to fail.');
                            break;
                        case e.target.error.MEDIA_ERR_DECODE:
                            console.error('The audio playback was aborted due to a corruption problem or because the audio used features your browser did not support.');
                            break;
                        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            console.error('The audio was not loaded, either because the server or network failed or because the format is not supported.');
                            break;
                        default:
                            console.error('An unknown error occurred.');
                            break;
                    }
                }, false);

            }

        },

        /*
         *
         * Resync audio and video when they're off by more than a few frames
         *
         */
        timeUpdate: function (e) {

            /*
            This is a hack for audio and video preloading in the background.
            They need to start playing in order for the preloading to work.
            As soon as they do, we pause them.
             */
            if (this.pauseOnTimeUpdate) {
                if (this.audio && this.audio.currentTime > 0) {
                    this.audio.currentTime = 0;
                    this.audio.pause();
                }
                if (this.video.currentTime > 0) {
                    this.video.currentTime = 0;
                    this.video.pause();
                }
            }

            // resync audio to video
            if (Player.AV_RESYNC_ENABLED && Player.AUDIO_VIDEO_SEPARATE && !this.seeking && this.playing) {

                if (Math.abs(this.video.currentTime - this.audio.currentTime) > this.tolerance && this.audio.currentTime < this.video.duration) {

                    if (++this.offsetFramesCount >= Player.MIN_OFFSET_FRAMES_TO_RESYNC) {

                        this.offsetFramesCount = 0;
                        this.resyncVideoToAudioTime();

                    }

                } else {

                    this.offsetFramesCount = 0;

                }

            }

            if (this.video) {
                this.currentTime = this.video.currentTime;
            }
        },

        resyncVideoToAudioTime: function () {

            console.log('Resyncing Audio & Video ( delay is ', this.audio.currentTime - this.video.currentTime, ')');
            this.resyncingVideoCurrentTime = this.video.currentTime;
            this.resyncStartTime = performance.now();
            this.seek(this.audio.currentTime);

        },

        /*
         *
         * Loading & progress
         *
         */
        loadProgress: function (e) {

            if (this.video.buffered.length !== 0) {
                this.buffer = this.video.buffered.end(0) / this.video.duration;
                this.bufferTime = this.video.buffered.end(0);
                this.checkReady();
            }

        },

        loadReadyAudio: function (e) {
            this.audioLoadReady = true;
            if (this.videoLoadReady) {
                this.loadComplete();
            }
        },

        loadReadyVideo: function (e) {
            this.videoLoadReady = true;
            this.canPlayThrough = 'true';
            if (!this.audio || this.audioLoadReady) {
                this.loadComplete();
            }
        },

        loadComplete: function (e) {
            this.loadReady = true;
            this.checkReady();
        },

        checkReady: function () {

            if (Player.REQUIRE_MIN_BUFFER_FOR_READY) {
                if (this.video && this.buffer > Player.MIN_BUFFER_TO_PLAY) {
                    this.onReadyToPlay();
                }
            } else {
                if (this.video && (this.loadReady || this.buffer > Player.MIN_BUFFER_TO_PLAY)) {
                    this.onReadyToPlay();
                }
            }

        },

        getAverageResyncDifference: function (e) {
            if (this.resyncDifferences.length === 0) return ( 0.0 );

            //maximum array size
            this.resyncDifferences = this.resyncDifferences.slice(Math.max(this.resyncDifferences.length - 6, 0));
            var average = 0.0;

            //remove shortest and longest values
            var differences = this.resyncDifferences.slice();
            if (differences.length > 2) {
                differences.sort();
                differences = differences.slice(1, differences.length - 1);
            }

            //get average
            for (var i = 0; i < differences.length; i++) {
                average += differences[i];
            }
            return average / differences.length;
        },

        getMaxSeekTime: function (requestedTime) {

            return this.audio ? Math.min(this.getMaxSeekTimeForMedia(this.audio, requestedTime), this.getMaxSeekTimeForMedia(this.video, requestedTime)) : this.getMaxSeekTimeForMedia(this.video, requestedTime);

        },

        getMaxSeekTimeForMedia: function (media, requestedTime) {

            var maxSeekTime = -1,
                i;

            for (i = 0; i < media[Player.SEEKABLE_PROPERTY].length; ++i) {

                if (media[Player.SEEKABLE_PROPERTY].start(i) < requestedTime) {

                    if (media[Player.SEEKABLE_PROPERTY].end(i) < requestedTime) {

                        maxSeekTime = Math.max(media[Player.SEEKABLE_PROPERTY].end(i) - 0.5, 0); // seeking exactly to the end time causes errors sometimes

                    } else {

                        maxSeekTime = requestedTime;
                        break;

                    }

                }

            }

            return maxSeekTime;

        },

        onReadyToPlay: function () {

            if (this.qualityChanged) {
                this.qualityChanged = false;
                return this.seek(this.qualityChangeVideoTime);
            }

            if (!this.ready) {
                this.ready = true;
                this.readyToPlay = 'true';
                this.events.trigger(Player.EVENT_LOADING_READY);
            }

        },

        onWaiting: function () {

            console.log('waiting...');

        },

        /**
         * Called once the video or audio seek is complete.
         * If both are complete, a time re-sync message is sent to mobile.
         * The seek state is preserved for RemoteController.RESYNC_TIME milliseconds, after which the playback resumes.
         */
        onSeekComplete: function () {

            var self = this;

            console.log('** SEEK COMPLETE **', 'seeking:', this.seeking, 'audio ready:', (!this.audio || !this.audio.seeking), 'video ready:', !this.video.seeking);


            if (this.seeking && (!this.audio || !this.audio.seeking) && !this.video.seeking) {

                RemoteController.getInstance().resyncExperienceTime(this.getCurrentTime() * 1000);

                clearTimeout(this.resyncTimeoutId);
                this.resyncTimeoutId = setTimeout(function () {


                    self.events.trigger(Player.EVENT_CONNECTING_MESSAGE_HIDE, [true]);

                    self.seeking = false;
                    TimelineController.getInstance().events.trigger(TimelineController.ENABLE_SEEK_INTERACTION, [true]);
                    self.events.trigger(Player.EVENT_SEEKED);
                    if (self.forcePlayAfterSeek) {
                        self.play(true);
                    }
                    console.log('[DEBUG] seek time:', window.performance.now() - self.seekStartTime);

                }, InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING ? RemoteController.RESYNC_TIME : 0);

            }

        },

        onBlocked: function () {

            console.log('!!!! blocked !!!!');

            if (this.forcedResolution) {
                console.log('this is a forced resolution, not applying any fix');
            }

            if (!this.switchToLowerQuality()) {
                TimelineController.getInstance().resume();
                this.seek(this.video.currentTime + 0.1);
            }

            this.waiting = false;
            this.blocked = false;
            this.numWaiting = 0;

        },

        onFrame: function () {

            if (this.playing && !this.qualityChanged) {

                if (this.video.currentTime === this.lastFrameTime) {
                    if (!this.waiting) {
                        console.log('!!!! waiting !!!!', this.numWaiting);
                        this.numWaiting += 1;
                        this.waiting = true;
                        this.waitStartTime = performance.now();
                    }
                    if (!this.blocked && (performance.now() - this.waitStartTime > Player.MAX_TIME_WAITING || this.numWaiting > Player.MAX_NUM_WAITING)) {
                        this.blocked = true;
                        this.onBlocked();
                    }

                } else {
                    if (this.waiting) {
                        console.log('!!!! wait fix auto !!!!');
                    }
                    if (this.blocked) {
                        console.log('!!!! BLOCK FIX !!!!');
                    }
                    this.waiting = false;
                    this.blocked = false;
                }

                this.lastFrameTime = this.video.currentTime;

            }

        }
    }
});
