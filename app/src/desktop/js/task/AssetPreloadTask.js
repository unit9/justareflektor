/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/1/13
 * Time: 1:23 PM
 */

var AssetPreloadTask = Task._extend(Class.ABSTRACT, {

    _public: {

        construct: function (packageName, assetName) {

            var platform = DetectionController.getInstance().platform,
                display = DetectionController.getInstance().display,
                url = 'img/' + packageName + '/' + platform + '/' + packageName + '-' + platform + '-' + display + '/' + assetName;

            Task.call(this, [new ImagePreloadTask(url)], 0);

        }

    }

});
