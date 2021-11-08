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

// set up our cert bot signed cert
const options = {
    key: fs.readFileSync('C:\\Certbot\\live\\middleman.ycpradiotelescope.com\\privkey.pem'),
    cert: fs.readFileSync('C:\\Certbot\\live\\middleman.ycpradiotelescope.com\\cert.pem'),
    ca: fs.readFileSync('C:\\Certbot\\live\\middleman.ycpradiotelescope.com\\chain.pem')
}

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
    ws.send('Middleman Recieved Your Message and will forward it to control room.');

    // BEGIN ACTING AS CLIENT
    // fwd data to final server
    var client = new net.Socket();
    // the control room is on the same computer, so local host for address
    // forwardPort should be the port the control room listens on
    client.connect(forwardPort, '127.0.0.1', function() 
    {
        console.log('MIDDLEMAN: Connected to final server');
        client.write(frontEndCommand);
    });

    client.on('data', function(data) 
    {
        console.log('CONTROL ROOM: ' + data);
        // destroy the connection each time, we want the user to reauthenticate each time
        client.destroy(); 
    });
    wss.close();
    });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ///
// /// create the middleman itself
// ///
// http.createServer(function(req, res) {
//     // return a success message & code so we know if we passed auth
//     res.statusCode = 200;
//     res.end("MIDDLEMAN: Succesfully connected through proxy server to middleman");
// }
// ).listen(middlemanPort, function() 
// {
//     console.log("middleman listening at http://127.0.0.1:" + middlemanPort + "/");

// }).on('connection', function(socket)
// {
//     console.log('MIDDLEMAN: A new connection has been established.');

//     // Now that a TCP connection has been established, the server can send data to
//     // the client by writing to its socket.
//     // socket.write('Hello, source client.'); <-- commented out, old debugging print
    
//     // The server can also receive data from the client by reading from its socket.
//     socket.on('data', function(chunk) 
//     {
//         console.log(`MIDDLEMAN: Data received from client:\n\n${chunk.toString()}`);
//         console.log('MIDDLEMAN: Finished printing data from client\n');



//     // When the client requests to end the TCP connection with the server, the server
//     // ends the connection.
//     socket.on('end', function() 
//     {
//         console.log('Closing connection with the source client');
//     });
    
//     // Don't forget to catch error, for your own sake.
//     socket.on('error', function(err)
//     {
//         console.log(`Error: ${err}`);
//     });
// });
