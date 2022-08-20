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


  if (clients[0]) {
    const my_socket = io.sockets.sockets.get(clients[0]?.socketId);
    my_socket.emit('box/fetch/configuration', 'test', (response) => {

      socket.emit('UPDATE_CONFIGURATION', response, (re) => {
        console.log('test on connection ', re);
      });
    });
  }


  socket.on('agg/execution/process', async (arg1, callback) => {


    console.log(arg1);

    const readFilePromise = () => {
      return new Promise((resolve, reject) => {
        const my_socket = io.sockets.sockets.get(clients[0].socketId);
        my_socket.emit('box/execution/process', arg1, (response) => {
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



  socket.on('agg/synchronize/status', async (response, callback) => {
    console.log('status', response);
    socket.broadcast.emit('front/synchronize/status', response);
    callback({ ack: 'ok' });
  });


  socket.on('agg/fetch/configuration', async (configuration, callback) => {
    const dto = {
      configuration: configuration.data
    }
    const my_socket = io.sockets.sockets.get(clients[0].socketId);
    const readFilePromise = () => {
      return new Promise((resolve, reject) => {

        my_socket.emit('box/fetch/configuration', 'test', (response) => {
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

  socket.on('agg/synchronize/configuration', (configuration, callback) => {
    const dto = {
      configuration: configuration.data
    }

    const my_socket = io.sockets.sockets.get(clients[0].socketId);
    my_socket.emit('box/synchronize/configuration', dto, (response) => {
      console.log('yoyo', response);
      socket.broadcast.emit('UPDATE_CONFIGURATION', JSON.stringify(response), (re) => {
        console.log('test', re);
      });
    });



  });



  // socket.on('agg/synchronize/configuration-partial', (data, callback) => {

  //   console.log('test data from sync front', data.sequences);


  //   const my_socket = io.sockets.sockets.get(clients[0].socketId);
  //   my_socket.emit('box/synchronize/configuration-partial', data, (response) => {
  //     console.log('yoyo', response);
  //     const struc = { cycle: response , update:true }
  //     callback({ config: struc });
  //     io.emit('UPDATE_CONFIGURATION', JSON.stringify(struc), (re) => {
  //       console.log('test', re);
  //     });



  //   });

  // });

  socket.on('agg/synchronize/configuration-partial', (data, callback) => {
    const my_socket = io.sockets.sockets.get(clients[0].socketId);
    my_socket.emit('box/synchronize/configuration-partial', data, (response) => {
      const struc = { cycle: response, update: true }
      socket.broadcast.emit('UPDATE_CONFIGURATION', JSON.stringify(struc));
      callback({ config: JSON.stringify(struc) });
    });

  });

  socket.on('agg/sycnhronize/schedule', (configuration, callback) => {

    console.log(configuration);
    const my_socket = io.sockets.sockets.get(clients[0].socketId);
    socket.broadcast.emit('box/synchronize/schedule', configuration, (response) => {
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