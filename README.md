# tcpMiddleman

TCP Middleman. This is a proxy between the TCP client and TCP server. The client (mobileapp/front-end) will send data here, then this middleman service will forward it to the server (control room).

Steps to set up:
1. npm install ws
2. run the server before running this service
3. run 'node index.js'
