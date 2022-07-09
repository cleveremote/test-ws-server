const { CLIENT_RENEG_LIMIT } = require('tls');
const util = require('util');

var http = require('http'),
  socketIO = require('socket.io'),
  fs = require('fs'),
  server,
  io;

server = http.createServer(function (req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(5001);
io = socketIO(server);
var clients = []
io.on('connection', function (socket) {
  console.log('incomming id', socket.id);
  const found = clients.findIndex(x => x.boxId === "1234");
  if (found === -1 && socket.handshake.headers['mytestbox'] === "1234") {
    clients.push({ socketId: socket.id, boxId: socket.handshake.headers['mytestbox'] });
  } else if (socket.handshake.headers['mytestbox'] === "1234") {
    clients[found].socketId = socket.id;
  }



  socket.on('execute', async (arg1, callback) => {
    const dto = {
      id: arg1.id,
      status: 'STOPPED',
      action: 'ON',
      function: 'FUNCTION',
      mode: 'FORCE',
      type: 'NOW',
      duration: Number(arg1.duration)
    }

    console.log(dto);

    const readFilePromise = () => {
      return new Promise((resolve, reject) => {
        const my_socket = io.sockets.sockets.get(clients[0].socketId);
        my_socket.emit('execution/task', dto, (response) => {
          resolve(response)
        });
      })
    }
    
    const t = await readFilePromise();
    callback({ config: t });
  });

  socket.on("disconnect", () => {
    console.log(socket.id); // undefined
  });




  socket.on('getConfiguration', async (configuration, callback) => {
    const dto = {
      configuration: configuration.data
    }

    const my_socket = io.sockets.sockets.get(clients[0].socketId);


    const readFilePromise = () => {
      return new Promise((resolve, reject) => {

        my_socket.emit('fetch/configuration', 'test', (response) => {
          resolve(response)
        });
      })
    }

    const t = await readFilePromise();
    callback({ config: t });

    // my_socket.emit('fetch/configuration', 'test',(response) => {
    //   console.log('callback',callback);
    //   //callback({ config:response });
    //   console.log('response configuration',response);
    // });

  });

  socket.on('synchronize', (configuration, callback) => {
    const dto = {
      configuration: configuration.data
    }

    const my_socket = io.sockets.sockets.get(clients[0].socketId);
    my_socket.emit('synchronize/configuration', dto, (response) => {
      console.log('yoyo', response);
    });

  });

  socket.on('test-with-response', (arg1, callback) => {
    callback({ status: 'ok' });
  });

  socket.on('test-with-no-response', (arg1, callback) => {
    callback();
  });
});