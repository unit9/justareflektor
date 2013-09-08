/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright UNIT9 Ltd.
 */

var AssetsAdapter = Class._extend(Class.SINGLETON, {

    _static: {

        TYPE: {

            IMAGE: "AssetsAdapterTypeImage",
            JSON: "AssetsAdapterTypeJsonData",
            SHADER: "AssetsAdapterTypeShader"

        },

        register: function (path, type, isSequence, sequenceId, sceneNo) {

            return {path: path, type: type, isSequence: isSequence, sequenceId: sequenceId, sceneNo: sceneNo};  // TEMP

        }

    },

    _public: {

    }

});
