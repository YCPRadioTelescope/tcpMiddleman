const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8090 })

console.log('middleman listening...');
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`)
  })
  ws.send('hi!')
})


const wSocket = new WebSocket('ws://10.0.0.147:8010', {
  perMessageDeflate: false
});

wSocket.on('open', function open() {
  wSocket.send('something');
});

wSocket.on('message', function incoming(data) {
  console.log(data);
});