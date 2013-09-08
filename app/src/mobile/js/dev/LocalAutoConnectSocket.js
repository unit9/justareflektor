/**
 *
 * A simple Websocket module that connects to a local node.js webserver
 * The webserver gives pushes the latest connection code / url to our mobile device
 * This allows for quick auto-reconnection of the phone and computer when testing locally.
 *
*/
var LocalAutoConnectSocket = Class._extend(Class.SINGLETON, {

	_static: {

		EVENT_URL_RECEIVED: 'LocalAutoConnectSocket_EVENT_URL_RECEIVED',
		PORT: 9999

	},



    _public: {

        enabled: /localhost/.test(window.location.host) || /127.0.0.1/.test(window.location.host) || /^192.168./.test(window.location.host),
        targetUrl: null,
        targetCode: null,
        targetIp: null,

    	construct: function() {

    	},

    	connect: function() {
    		if (!this.enabled || this.socket) return;

    		var self = this;
    		window.WebSocket = window.WebSocket || window.webkitWebSocket || window.MozWebSocket;
    		

    		this.socket = new window.WebSocket('ws://'+window.location.hostname+':'+LocalAutoConnectSocket.PORT);

    		//bind events
    		this.socket.addEventListener('message',function(msg) {
				self.socketMessage(JSON.parse(msg.data));
			});
			this.socket.addEventListener('open', function (data) {
				self.socketConnect(data);
			});
		   	this.socket.addEventListener('close',function(error) {
				self.socketClose(error);
		   	});
    	},

    	publishURL: function(url,code,ip) {
    		if (!this.enabled) return;

    		var message = JSON.stringify({action:'publish', url:url, code:code, ip:ip});

    		if (!this.connected) {
    			this.messageQueue.push(message);
    			this.connect();
    			return;
    		}

    		this.socket.send(message);
    	},

    	askForURL: function() {
    		if (!this.enabled) return;

    		var message = JSON.stringify({action:'requestURL'});

    		if (!this.connected) {
    			this.messageQueue.push(message);
    			this.connect();
    			return;
    		}

    		this.socket.send(message);
    	}
    },

    _private: {

    	socket: null,
    	connected: false,
    	messageQueue: [],

    	socketConnect: function() {
    		this.connected = true;
    		for (var i=0; i<this.messageQueue.length; i++) {
    			this.socket.send(this.messageQueue[i]);
    		}
    		this.messageQueue = [];
    	},

    	socketClose: function(e) {
    		this.connected = false;
    		console.warn('LocalAutoConnectSocket Closed: ',e);
    	},


    	socketMessage: function(message) {
    		if (message.action === 'publish') {
    			targetUrl = message.url;
    			targetCode = message.code;
    			targetIp = message.ip;
    			this.events.trigger(LocalAutoConnectSocket.EVENT_URL_RECEIVED, [message]);
    		}
    	} 

    }
});