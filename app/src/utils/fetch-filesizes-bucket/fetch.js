/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright UNIT9 Ltd.
 */

var fs = require('fs');
var http = require("http");
var filenames = require('../../../resources.json');
var bucket = "arcade-fire.commondatastorage.googleapis.com";
var queue = 0;

function save() {
	fs.writeFile('../../../resources.json', JSON.stringify(filenames, null, 4)); 
}

function updateFilesize(file, category) {

	var options      = { host: bucket, port: 80, path: '/' + file },
		fileName     = file,
	    categoryName = category;

	var req = http.get(options, function(res) {
	    filenames[categoryName][fileName].filesize = (parseInt(res.headers["content-length"])/1024/1024).toFixed(4);
	    console.log(categoryName, '/', fileName, ':\t\t[', filenames[categoryName][fileName].filesize, 'MB ]');
	    req.abort();
	    queue--;
	    if(queue==0) save();
	});

}

console.log('getting filesizes...');
for (var category in filenames) {
    for(var file in filenames[category]) {
    	if(file.indexOf("{") < 0) {
    		queue++;
    		updateFilesize(file,category);
    	}
    }
}
console.log('done');