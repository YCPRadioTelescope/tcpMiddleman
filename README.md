# tcpMiddleman

This is the middleman! The purpose of this server is to proxy incoming connections to the control room.

## Getting Started
### Pre-Reqs
  * node and npm installed 
  * you either have the cert.pem and the key.pem file from another member on the team, or you have openssl installed and have generated your own (either works)
  * port the proxy for the middleman listens on (5000 at time of writing) forwarded on your router. 
    * Figure out the ip of the machine hosting the middleman on your local subnet. On windows, run ipconfig in the command promt to figure that out
    * log into your router by typing something along the lines of (192.168.0.1) in your browser. This changes based on your router.
    * find the setting where you can specify port forwarding
    * forward port 5000 (or whatever you want the proxy in middleman.js to be listening on) to go to the ip of the machine you found earlier.

* After cloning, run npm install to get all the packages needed to run
* Verify the forwardPort in middleman.js is set to whichever server you wish to ferry requests to
  * If testing, the port the test-finalServer listens on is 3434. This is configurable to whatever you want in test-finalServer.js
  * If production, the control rooms remote listener listens on port 80. forwardPort should be pointing to this
* Configure the secrets.json file to have the required credentials you want
  * Copy template.secrets.json, and remove the .template from the copied file. The template exists so fresh users can more easily see the structure of the secrets.json
  * update the username and password fields to whatever you want (try to put some special characters in the password please)
* Run the "final" server (test-finalServer.js or the control room itself)
* Run the middleman

### Figuring out the connection string to give the front end
* Find the IP4 address for your router (google "whats my ipv4")
* The front end connects to "your ipv4":"port you forwarded"

### Useful Commands
Running a javascript file
`node middleman.js`

Installing npm packages for the project
`npm install`

# Security Features

## Proxy Server inside the Proxy Server 

The middleman itself is a proxy for the control room, but to make the authentication process easier we utilize 2 http(s) servers.

The first one is an HTTPS proxy for the HTTP middleman. We use a self signed certificate since the only thing touching this server

should be us (programmatically). 

## Basic Auth

We use basic authentication to ensure requests are legitimate. Future work will be upgrading this measure of authentication, but for now basic is all we need.

The requests are encrypted by the HTTPS protocol anyways, and for the measure of security needed encrypted basic is plenty for us.




