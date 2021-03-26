// Include Nodejs' net module.
const Net = require('net');
// The port on which the server is listening.
const port = 3434;

// Use net.createServer() in your code. This is just for illustration purpose.
// Create a new TCP server.
const server = new Net.Server();
// The server listens to a socket for a client to make a connection request.
// Think of a socket as an end point.
// TODO: this was listening on address 0.0.0.0, is that needed?
server.listen(port ,  "127.0.0.1", function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Final Server listening for connection requests on socket http://%s:%s", host, port)

});

// When a client requests a connection with the server, the server creates a new
// socket dedicated to that client.
server.on('connection', function(socket) 
{
    console.log('A new connection has been established.');

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    socket.write('TEST-FINALSERVER: Hello, source client.');

    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function(chunk) 
    {
        console.log(`Data received from client:\n\n ${chunk.toString()}`);
        console.log('finished receiving data from client\n');
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
