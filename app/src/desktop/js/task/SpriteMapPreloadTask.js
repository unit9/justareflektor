/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 5/13/13
 * Time: 12:13 AM
 */

var SpriteMapPreloadTask = Task._extend(Class.ABSTRACT, {

    _static: {

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

            var self = this, rule, mapUrl, maxj;

            for (var i = 0; i < document.styleSheets.length && !mapUrl; ++i) {

                maxj = document.styleSheets[i].cssRules ? document.styleSheets[i].cssRules.length : document.styleSheets[i].rules.length;

                for (var j = 0; j < maxj; ++j) {

                    rule = document.styleSheets[i].cssRules ? document.styleSheets[i].cssRules[j] : document.styleSheets[i].rules[j];
                    if (rule.selectorText === '.detection .url-' + this.mapName) {

                        mapUrl = rule.cssText ? rule.cssText.match('url(.*)')[0] : rule.style.content;
                        mapUrl = mapUrl.substring(mapUrl.indexOf('img/'), mapUrl.indexOf(')')).replace('\'', '').replace('"', '');
                        break;

                    }

                }

            }

            var $div = $('<div/>').css('background-image', 'url(\'' + mapUrl + '\')');
            $('.preload').append($div);

            var image = new Image();

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
