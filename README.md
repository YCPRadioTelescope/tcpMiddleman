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

### Set Up

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

# HOW TO GET ANOTHER CERT FOR HTTPS
Hello! The cert I figured out to use is [certbot](https://certbot.eff.org/) - a tool used to get a local server (or any server) a private cert signed by a trusted authority. Without a proper cert, 

> **the front-end will not be able to connect to the middleman. It will throw CORS errors. The CORS stuff is properly set up here, but as a part of CORS it requires an https domain to have a cert signed by a trusted authority.**

So, how to get another cert! On the RT server computer, certbot it already installed. As of writing, our cert expires on **2021-07-04**. I couldn't do anything to extend this time. To refresh this cert you can run...

* `certbot renew` which should renew the existing cert 
* `certbot certonly --standalone` which will recreate the cert

For each of the above methods you should not have to change any of the pathing in `middleman-server.js`, certbot writes to it's own directory. Nothing is localized to the middleman.

**NOTE:** certbot uses port 80 to ping the domain you give it. To set up the domain, go to AWS Route53 and check the domain middleman.ycpradiotelescope.com. This is the domain I have pointed at (at time of writing) the server computer's IP. This needs to be set to the correct IPv4 of the control room computer. Next, in the firewall you must open port 80 to the control room PC's local subnet address. This address should start with `192.*.*.53` or something like that, while your IPv4 given by your ISP will be different. **If you don't open the port, the challenge routine will fail and you will not be issued another cert.**


# Security Features

## Proxy Server inside the Proxy Server 

The middleman itself is a proxy for the control room, but to make the authentication process easier we utilize 2 http(s) servers.

The first one is an HTTPS proxy for the HTTP middleman. We use a self signed certificate since the only thing touching this server

should be us (programmatically). 

## Basic Auth

We use basic authentication to ensure requests are legitimate. Future work will be upgrading this measure of authentication, but for now basic is all we need.

The requests are encrypted by the HTTPS protocol anyways, and for the measure of security needed encrypted basic is plenty for us.




