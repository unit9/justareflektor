/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/31/13
 * Time: 1:11 PM
 */

var Config = Class._extend(Class.SINGLETON, {

    _static: {

        RULES: [

            {host: '/([\\d]{1,3}\\.){3}[\\d]{1,3}|localhost', config: ConfigLocal},
            {host: 'dev.arcade-fire.appspot.com', config: ConfigDev},
            {host: 'test.arcade-fire.appspot.com', config: ConfigTest},
            {host: '.*', config: ConfigProd}

        ]

    },

    _public: {

        construct: function () {

            var i, config, field;

            config = new ConfigCommon();

            for (field in config) {

                if (config[field] !== undefined) {

                    this[field] = config[field];

                }

            }

            for (i = 0; i < Config.RULES.length; ++i) {

                if (window.location.toString().match(new RegExp(Config.RULES[i].host))) {

                    config = new (Config.RULES[i].config)();
                    config._class = Config.RULES[i].config;
                    break;

                }

            }

            for (field in config) {

                if (config[field] !== undefined) {

                    this[field] = config[field];

                }

            }

        }

    }

});
