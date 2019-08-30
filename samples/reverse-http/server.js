
const PORT = process.env.PORT || 8080;

const http = require('http');

const server = http.createServer((req, res) => {

    console.log(`Request "${req.method}" "${ req.url }"`);

    res.write(JSON.stringify({ok: true}));
    res.end();

});

server.on('upgrade', (req, socket, head) => {

    if (req.headers['upgrade'] !== 'PTTH/1.0') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }

    console.log(`Upgrade request "${ req.method }" "${ req.url }"`);

    socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: PTTH/1.0\r\n' +
        'Connection: Upgrade\r\n' +
        '\r\n');

    function getTime (callback) {

        const options = {
            method: 'GET',
            path: '/',
            createConnection: () => socket,
            headers: {
                connection: 'keep-alive'
            }
        };

        console.log(`Requesting a client for reply...`);

        const clientReq = http.request(options, (res) => {

            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

            let data = [];

            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                data.push(chunk);
            });

            res.on('end', () => {

                data = JSON.parse(data.join(''));

                console.log( `Result: '${ data.time }'` );

                callback(data.time);

            });

        });

        clientReq.on('error', err => {

            console.error(`Error: "${err}"`);

            if (err.stack) {
                console.error(err.stack);
            }

        });

        clientReq.end();

    }

    setInterval( () => {

        getTime( time => {

            console.log(`We got time as "${time}"`);

        });

    }, 1000);

});

server.listen(PORT);
