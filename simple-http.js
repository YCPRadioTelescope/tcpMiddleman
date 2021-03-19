const http = require('http');

// auth client to add basic auth to middleman
var auth = require('http-auth');
var basic = auth.basic({
    authRealm: "Private area",
    // this file was generated using htpasswd
    // to make another password for rt run the command below in the middleman directory
    // > htpasswd -bc server-passwords rt [PASSWORD]
    authFile: __dirname + "/server-passwords",
    authType: "basic"
});

const net = require('net');

// to get this file, you need to copy template.secrets.json, populate the data accordingly, 
// and then remove the template. from infront
// const secrets = require('C:\\Users\\ycas-admin\\source\\repos\\tcpMiddleman\\secrets.json');


const port = 5000;
// 8082 is for PLC and 8083 is for MCU
const forwardPort = 3434;

authFlag = false;

///
/// auth wrapper around middleman net tcp server
///
var server = http.createServer(function(req, res) 
{
    // throw through basic auth, checking for username and password specified server-passwords
    basic.check(req, res, function(username) {
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("succesfully authenticated user: " + username);
        res.end();
    });
}).listen(5000, function() 
{
    console.log("middleman listening on port " + port);
}).on('connection', function(socket) // start listening, and also set the on connection event by passing a socket object through
{
    console.log('A new connection has been established.');

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    socket.write('Hello, source client.');
    
    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function(chunk) 
    {
        console.log(`Data received from client: ${chunk.toString()}`);
    
        // BEGIN ACTING AS CLIENT
        // fwd data to final server
        var client = new net.Socket();
    
        // the control room is on the same computer, so local host for address
        // forwardPort should be the port the control room listens on
        client.connect(forwardPort, '127.0.0.1', function() 
        {
            console.log('Connected to final server');

            // TODO: how does the control room interpret the data? Is it better to send plain text as we are here?
            client.write(chunk.toString());
        });
    
        client.on('data', function(data) 
        {
            console.log('Received: ' + data);
            // TODO: does the client need to be destroyed every time it sends data?
            //       this is determined by how the control room handles data.
            //       short answer, it probably does not need to be destroyed each time
            //       but until the control room is set up properly this will hang as a ?
            // client.destroy(); // kill client after server's response
        });
    
        // TODO: this is only a listener for the closing of the socket, how do we end the connection?
        //       previous implentation ended after any data was sent. Could the control room signal the end of the connection
        //       - then  the middleman responds by sending a client.destroy()?
        client.on('close', function() 
        {
            console.log('Client connection closed');
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