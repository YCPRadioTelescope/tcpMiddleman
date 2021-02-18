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
        // this is only here to easily see a new username and password to test against below
        // console.log('hashed username: ', md5(username));
        // console.log('hashed password: ', md5(password));

        console.log('secret username: ', secrets.username);
        console.log('secret password: ', secrets.password);

        if((username = secrets.username) && (password == secrets.password))
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
  
        // TODO: Where should this forward to?
        //       Localhost control room port?
        client.connect(forwardPort, '127.0.0.1', function() 
        {
            console.log('Connected to final server');
            client.write(chunk.toString());
        });
    
        client.on('data', function(data) 
        {
            console.log('Received: ' + data);
            client.destroy(); // kill client after server's response
        });
    
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
