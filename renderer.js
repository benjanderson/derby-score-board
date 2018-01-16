// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const serialport = require('serialport')
const createTable = require('data-table')

// serialport.list((err, ports) => {
//   console.log('ports', ports);
//   if (err) {
//     document.getElementById('error').textContent = err.message
//     return
//   } else {
//     document.getElementById('error').textContent = ''
//   }

//   if (ports.length === 0) {
//     document.getElementById('error').textContent = 'No ports discovered'
//   }

//   const headers = Object.keys(ports[0])
//   const table = createTable(headers)
//   tableHTML = ''
//   table.on('data', data => tableHTML += data)
//   table.on('end', () => document.getElementById('ports').innerHTML = tableHTML)
//   ports.forEach(port => table.write(port))
//   table.end();
// })

serialport.list((err, ports) => {
    console.log(ports);
    var port = new serialport(ports[1].comName, {
        baudRate:9600,
        databits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false,
        // parser: serialport.parsers.readline("\n"),
    });

    port.on('open', () => {
        console.log('Port Opened', port);

        port.on('data', (data) => {
            /* get a buffer of data from the serial port */
            console.log(data.toString());
        });
    });

    port.on('error', function(err) {
        console.log('Error: ', err.message);
    })

    // port.write('main screen turn on', (err) => {
    //     if (err) { return console.log('Error: ', err.message) }
    //     console.log('message written');
    // });

    
});

