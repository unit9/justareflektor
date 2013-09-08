/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright UNIT9 Ltd.
 */


var fs = require('fs');
var filesToCheck = [];

var AssetPreloadTask = function(packageName,assetName)
{

	this.addFile= function(platform,display)
	{
		filesToCheck.push('img/' + packageName + '/' + platform + '/' + packageName + '-' + platform + '-' + display + '/' + assetName);
	}

	this.addFile("desktop","1x");
	this.addFile("desktop","2x");
	this.addFile("mobile","1x");
	this.addFile("mobile","2x");
	this.addFile("tablet","1x");
	this.addFile("tablet","2x");

	return this;
}

var Task = (function()
{
	this._extend=function(i){ i._public.construct.apply(); }
	this.call = function(){}
	return this;
})();

eval(fs.readFileSync(__dirname+"/js/task/MainPreloadTask.js")+'');
var json_data = { filesSizes : [] };

for(var i=0; i<=filesToCheck.length-1; i++)
{
	var file = filesToCheck[i];
	var stats = fs.statSync(__dirname+"/../../"+file);
    json_data.filesSizes.push({ file: file, size: stats.size });
    

}

console.dir(json_data);
fs.writeFile(__dirname+"/../../assets.json", JSON.stringify(json_data, null, 4)); 


