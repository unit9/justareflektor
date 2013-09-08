/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/22/13
 * Time: 12:53 AM
 */

var SpriteMapPreloadTask = Task._extend(Class.ABSTRACT, {

    _static: {

        ROOT: '/m/'

    },

    _public: {

        construct: function (mapName) {

            Task.call(this, [], 1);
            this.mapName = mapName;

        }

    },

    _protected: {

        mapName: null,

        run: function () {

            var self = this,
                rule,
                mapUrl,
                maxj,
                $div,
                image,
                i,
                j;

            for (i = 0; i < document.styleSheets.length && !mapUrl; ++i) {

                maxj = document.styleSheets[i].cssRules ? document.styleSheets[i].cssRules.length : document.styleSheets[i].rules.length;

                for (j = 0; j < maxj; ++j) {

                    rule = document.styleSheets[i].cssRules ? document.styleSheets[i].cssRules[j] : document.styleSheets[i].rules[j];
                    if (rule.selectorText === '.detection .url-' + this.mapName) {

                        mapUrl = rule.cssText ? rule.cssText.match('url(.*)')[0] : rule.style.content;
                        mapUrl = mapUrl.substring(mapUrl.indexOf('img/'), mapUrl.indexOf(')')).replace('\'', '').replace('"', '');
                        break;

                    }

                }

            }

            mapUrl = SpriteMapPreloadTask.ROOT + mapUrl;

            $div = $('<div/>').css('background-image', 'url(\'' + mapUrl + '\')');
            $('.preload').append($div);

            image = new Image();

            image.onload = function () {

                self.onPreloadComplete();

            };

            image.src = mapUrl;

        }

    },

    _private: {

        onPreloadComplete: function () {

            this.notifyDone();

        }

    }

});
