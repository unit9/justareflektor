/**
 *
 *
 * Websocket wrapper utility
 * Let's us use a more socket.io-like interface to the web worker with events and json messages
 *
*/
window.WebSocket = window.WebSocket || window.MozWebSocket;

WebSocket.prototype.callbacks = {};

WebSocket.prototype.initJSON = function() {
	this.callbacks = {};
	this.jsontosend = {event:null,data:null};
	this.addEventListener('message',function(messageReceived) {
		var obj = JSON.parse(messageReceived.data);
		if (this.callbacks[obj.event]) {
			this.callbacks[obj.event](obj.data);
		} else {
			console.log(obj.event +" socket event not handled.");
		}
	});
}

//socket callback handling
WebSocket.prototype.on = function(eventName,callback) {
	this.callbacks[eventName] = callback;
}
WebSocket.prototype.removeEvent = function(eventName) {
	this.callbacks[eventName] = null;
}

//add a new send event -> json
WebSocket.prototype.jsontosend = {event:null,data:null};
WebSocket.prototype.emit = function(eventName,data) {
	data.timeStamp = new Date().getTime();
	this.jsontosend.event = eventName;
	this.jsontosend.data = data;
	this.send(JSON.stringify(this.jsontosend));
};