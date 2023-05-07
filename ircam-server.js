const Hapi = require('@hapi/hapi');
const inert = require('@hapi/inert');
const socketIo = require('socket.io');
const { SyncServer } = require('@ircam/sync');

const startTime = process.hrtime();
const getTimeFunction = () => {
  const now = process.hrtime(startTime);
  return now[0] + now[1] * 1e-9;
}

// 
const syncServer = new SyncServer(getTimeFunction);

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

    io.on("connection", (socket) => {
        // the `receiveFunction` and `sendFunction` functions aim at abstracting 
        // the transport layer between the SyncServer and the SyncClient
        const receiveFunction = callback => {
            socket.on("ircam", ({ isPing, pingId, clientPingTime }) => {
                if (isPing) {
                    callback(pingId, clientPingTime);
                }
            });
        };

        const sendFunction = (pingId, clientPingTime, serverPingTime, serverPongTime) => {
            socket.emit("ircam", {
                isPing: false,
                pingId,
                clientPingTime,
                serverPingTime,
                serverPongTime
            });
        };

        syncServer.start(sendFunction, receiveFunction);
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();