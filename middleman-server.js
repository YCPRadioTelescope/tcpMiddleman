// imports
const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const fs = require('fs');
var auth = require('http-auth');
const net = require('net');
const { fstat } = require('fs');
const secrets = require(__dirname + '\\secrets.json');

// set up authentication
var basic = auth.basic({
    authRealm: "Private area",
},
 (username, password, callback) => {
    callback(username === secrets.username && password === secrets.password)
 }
);

// set up auth event listeners for console logging
basic.on("fail", result => {
    console.log(`PROXY: authentication failed: ${result.user}`);

});

basic.on("success", result => {
    console.log(`PROXY: authentication success: ${result.user}`);
});

basic.on("error", result => {
    console.log(`PROXY: authentication error: ${error.code + " - " + error.message}`);
});

// support CORS 
var enableCors = function(req, res) {
	if (req.headers['access-control-request-method']) {
        console.log("CORS: access-control-request-method: ", req.headers['access-control-request-method']);
		res.setHeader('access-control-allow-methods', req.headers['access-control-request-method']);
	}

	if (req.headers['access-control-request-headers']) {
        console.log("CORS: access-control-request-headers: ", req.headers['access-control-request-headers']);
		res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']);
	}

	if (req.headers.origin) {
        console.log("CORS: req.headers.origin: ", req.headers.origin);
		res.setHeader('access-control-allow-origin', req.headers.origin);
		res.setHeader('access-control-allow-credentials', 'true');
	}
};

const middlemanPort = 5001;
const proxyPort = 5000;

// 80 is the port remote listener on the control room looks for (prod forwardPort)
// 3434 is the port set for the test final server just to make sure things are working as they should 
const forwardPort = 80;

///
/// create HTTPS server which uses proxy server to forward authenticated requests to the real middleman
///
const proxy = httpProxy.createProxyServer({});
// set header for CORS
proxy.on("proxyRes", function(proxyRes, req, res) {
	enableCors(req, res);
});

 
//Receive Command from Front End using WEBSOCKET Server. Requires Websocket, they are different from regular SOCKETS
//REGULAR SOCKETS ARE NOT BROWSER COMPATIBLE!!!!
var frontEndCommand = "Something went wrong...";
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 2222 })
console.log("WebSocket Server Created On Port 2222");

wss.on('connection', function connection(ws) {
    ws.on('message', function message(frontEndCommand) {
        console.log('FRONT END: %s', frontEndCommand);
        ws.send('Middleman recieved your message and will forward it to control room.');

        // BEGIN ACTING AS CLIENT
        // fwd data to final server
        var client = new net.Socket();
        // the control room is on the same computer, so local host for address
        // forwardPort should be the port the control room listens on
        client.connect(forwardPort, '127.0.0.1', function() 
        {
            console.log('MIDDLEMAN: Connected to control room');
            client.write(frontEndCommand);
        });

        client.on('data', function(data) 
        {
            console.log('CONTROL ROOM: ' + data);

            //client.destroy(); 
        });
        wss.close();
    });
});