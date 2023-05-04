const Hapi = require('@hapi/hapi');
const inert = require('@hapi/inert');
const socketIo = require('socket.io');
const { performance } = require('node:perf_hooks');

const getServerTime = () => performance.timeOrigin + performance.now();

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    const io = socketIo(server.listener);

    await server.register(inert);

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: 'client'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/lib/{param*}',
        handler: {
            directory: {
                path: 'lib'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/node_modules/{param*}',
        handler: {
            directory: {
                path: 'node_modules'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/time',
        handler: (request, h) => getServerTime(),
    });

    io.on("connection", (socket) => {
        console.log("a user connected");
        socket.on("disconnect", () => {
          console.log("user disconnected");
        });
      
        socket.on("gong", () => {
          console.log("received gong msg, emitting");
          io.emit("gong", { serverTime: getServerTime() });
        });

        // set up socket sync acknowledgement for GoTime
        socket.on("time", (arg1, arg2, callback) => {
          callback({ serverTime: getServerTime() });
        })
      });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();