// imports
const http = require('http');
const httpProxy = require('http-proxy');
var auth = require('http-auth');
const net = require('net');
const secrets = require(__dirname + '\\secrets.json');

// set up authentication
var basic = auth.basic({
    authRealm: "Private area",
},
 (username, password, callback) => {
    callback(username === secrets.username && password === secrets.password)
 }
);

// set up auth event listeners for logging
basic.on("fail", result => {
    console.log(`PROXY: authentication failed: ${result.user}`);

});

basic.on("success", result => {
    console.log(`PROXY: authentication success: ${result.user}`);
});

basic.on("error", result => {
    console.log(`PROXY: authentication error: ${error.code + " - " + error.message}`);
});

const middlemanPort = 5001;
const proxyPort = 5000;

// 80 is the port remote listener on the control room looks for (prod forwardPort)
// 3434 is the port set for the test final server just to make sure things are working as they should 
const forwardPort = 3434;

///
/// create proxy server which handles forwarding authenticated requests to the real middleman
///
const proxy = httpProxy.createProxyServer({});
http.createServer(
    basic.check(function(req, res) 
    {
        console.log("PROXY: forwarding proxy request to middleman");
        // forward the authenticated request to the middleman
        proxy.web(req, res, { target: "http://127.0.0.1:5001" });

    })).listen(proxyPort, function() {
        console.log("proxy server listening at http://127.0.0.1:" + proxyPort + "/");
});

///
/// create the middleman itself
///
http.createServer(function(req, res) {
    // return a success message & code so we know if we passed auth
    res.statusCode = 200;
    res.end("MIDDLEMAN: Succesfully connected through proxy server to middleman");
}
).listen(middlemanPort, function() 
{
    console.log("middleman listening at http://127.0.0.1:" + middlemanPort + "/");

}).on('connection', function(socket)
{
    console.log('MIDDLEMAN: A new connection has been established.');

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    // socket.write('Hello, source client.'); <-- commented out, old debugging print
    
    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function(chunk) 
    {
        console.log(`MIDDLEMAN: Data received from client:\n\n${chunk.toString()}`);
        console.log('MIDDLEMAN: Finished printing data from client\n');

        // BEGIN ACTING AS CLIENT
        // fwd data to final server
        var client = new net.Socket();

        // the control room is on the same computer, so local host for address
        // forwardPort should be the port the control room listens on
        client.connect(forwardPort, '127.0.0.1', function() 
        {
            console.log('MIDDLEMAN: Connected to final server');

            // TODO: how does the control room interpret the data? Is it better to send plain text as we are here?
            client.write(chunk.toString());
        });

        client.on('data', function(data) 
        {
            console.log('MIDDLEMAN: Received: ' + data);
            // destroy the connection each time, we want the user to reauthenticate each time
            client.destroy(); 
        });
    });

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on('end', function() 
    {
        console.log('Closing connection with the source client');
    });
    
    // Don't forget to catch error, for your own sake.
    socket.on('error', function(err)
    {
        console.log(`Error: ${err}`);
    });
});
