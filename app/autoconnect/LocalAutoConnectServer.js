/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 *
*/
"use strict";
process.title = 'LocalAutoConnectServer';

var PORT = 9999,

    //create server
    WebSocketServer = require('websocket').server,
    http = require('http'),
    server = http.createServer(null),
    wsServer = new WebSocketServer({
        httpServer: server
    }),

    //state
    latestConnectionCode = null,
    phoneSockets = [];


// This callback function is called every time someone tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection
    var connection = request.accept(null, request.origin); 
    connection.added = false;

    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            var data = JSON.parse(message.utf8Data);


            switch (data.action) {
                case 'publish':
                    latestConnectionCode = message.utf8Data;
                    console.log('Published Code: '+latestConnectionCode);
                    var sent = false;
                    for (var i=0; i<phoneSockets.length; i++) {
                        phoneSockets[i].send(latestConnectionCode);
                        sent = true;
                    }
                    //if (sent) latestConnectionCode = null;
                    break;

                case 'requestURL':
                    if (!connection.added) {phoneSockets.push(connection); connection.added = true;}
                    if (latestConnectionCode) {connection.send(latestConnectionCode); console.log('Phone Using Code: '+latestConnectionCode);}
                    //latestConnectionCode = null;
                    break;

            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
        for (var i=0; i<phoneSockets.length; i++) {
            if (phoneSockets[i] === connection) {
                phoneSockets.splice(i,1);
                i--;
            }
        }
    });

});

wsServer.on('error', function(e) {
    console.log(e);

});


//start the server
server.listen(PORT);
console.log('Running '+process.title+'. Waiting for connections.');