const http = require('http');
const net = require('net');

// to get this file, you need to copy template.secrets.json, populate the data accordingly, 
// and then remove the template. from infront
const secrets = require('/home/rt/tcpMiddleman/secrets.json');

/// this is only here to change the credentials passed in from the client connecting
/// to use this, uncomment down below the console.log the username and password you want to use
/// this can be done by locally trying to connect to localhost:port and then passing into the browser 
/// the credentials you want. Below 
// const md5 = require('md5');

const port = 5000;
const forwardPort = 3434;

///
/// auth wrapper around middleman net tcp server
///
var server = http.createServer(function(req, res) 
{
    // console.log(req);
 
    // if basic credentials are passed, it will be in the Authorization header
    var auth = req.headers['authorization'];
    console.log('auth header is: ', auth);

    if (!auth) 
    {
        res.statusCode = 401;
        
        // WWW-Authenticate tells the requester they need authentication to get in
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

        res.end('<html>' +
                    '<body>' +
                        '<h1>Access Denied</h1>'+
                    '</body>' +
                '</html>');

    } else if (auth) 
    {
        var tmp = auth.split(' '); // split on space to grab everything after Basic in the auth header
        var buf = new Buffer(tmp[1], 'base64');
        
        // decode base64
        var plainAuth = buf.toString();

        // basic auth is structured like this: username:password
        var creds = plainAuth.split(':');

        var username = creds[0];
        var password = creds[1];

        // uncomment below to see what the hashed username and password are
        // this is only here to easily set a new username and password by passing in plain text values
        // you could also do this with a new javascript file, but its okay here for now
        // console.log('hashed username: ', md5(username + "salt - put the salt string the client also uses here"));
        // console.log('hashed password: ', md5(password + "salt - put the salt string the client also uses here"));
        
        if((username == secrets.username) && (password == secrets.password))
        {
            res.statusCode = 200;
            res.end('<html>' +
                        '<body>' +
                            '<h1>The diamonds are behind the painting</h1>'+
                        '</body>' +
                    '</html>');
        } else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

            res.end('<html>' +
                        '<body>' +
                            '<h1>You dont seem to be on the list, let me ask my manager</h1>'+
                        '</body>' +
                    '</html>');
        }
    }
});

///
/// listen call
/// identical to net server.listen, also creates a listener for the events below
///
server.listen(5000, function() 
{
    console.log("Middleman listening on http://localhost:5000/");
});

///
/// main middleman logic
/// create client from existing connection, forward data to final destination
///
server.on('connection', function(socket) 
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
