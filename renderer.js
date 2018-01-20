const serialport = require('serialport')
const timespan = require('timespan');
const { webFrame } = require('electron')

function timerNum(id, clickCallback) {
    var _this = this;
    var $container = document.getElementById(id);
    var $numbers = $container.getElementsByClassName('num-item');
    var start;
    var tick;

    $container.addEventListener('click', function() {
        if (clickCallback) clickCallback();
    });

    var addClass = function(numItemElement, numberString, position) {
        if (numItemElement.classList.length >= 2) {
            numItemElement.classList.remove(numItemElement.classList[1]);
        }

        if (numberString.length >= 2) {
            numItemElement.classList.add("n" + numberString[position === 0 ? 1 : 0]);
        } else if (numberString.length == 1 && position == 0) {
            numItemElement.classList.add("n" + numberString[0]);
        } 
        else {
            numItemElement.classList.add("n0");
        }
    };

    _this.updateTime = function(seconds) {
        var wholeSeconds = Math.floor(seconds);
        
        var decimal = Math.floor((seconds % 1) * 100).toString();
        var hours = Math.floor(seconds / 3600).toString();
        var minutes = Math.floor(seconds / 60).toString();
        var seconds = Math.floor(seconds % 60).toString();

        addClass($numbers[0], hours, 1);
        addClass($numbers[1], hours, 0);
        addClass($numbers[2], minutes, 1);
        addClass($numbers[3], minutes, 0);
        addClass($numbers[4], seconds, 1);
        addClass($numbers[5], seconds, 0);
        addClass($numbers[6], decimal, 1);
        addClass($numbers[7], decimal, 0);
    };  

    _this.start = function() {
        start = new Date();
        tick = setInterval(function() {
            var ts = timespan.fromDates(start, new Date());
            var seconds = ts.totalSeconds();
            _this.updateTime(seconds);
        }, 1);
    };

    _this.stop = function() {
        clearInterval(tick);
    };
}

let port;
let portOptions;
let bestTime;
let zoomFactor = 1;
var $connection = document.getElementById('connect');
var $gear = document.getElementById('gear');
var $log = document.getElementById('log');
var $setup = document.getElementById('setup');
var $timer = document.getElementById('timer');
const lane1 = new timerNum('lane1', function (){ log('reset lane1'); lane1.updateTime(0); });
const lane2 = new timerNum('lane2', function (){ log('reset lane2'); lane2.updateTime(0); });
const best = new timerNum('best', function (){ log('reset best'); bestTime = 0; best.updateTime(0); });

const log = function(text, opt) {
    $log.innerHTML += '<strong>' + text + '</strong>' + (opt ? '<br>' + JSON.stringify(opt) : '') + '<br>';
}

var openPort = function() {
    const regex = /^(\d\W-\W)((?:\d|\.)+)/m;
    log('Port Opened', portOptions);

    port.on('data', function(data) {
        var dataString = data.toString();
        log('Data', dataString);
        if (dataString.length > 0 && dataString[0] === 'B') {
            log("Started");
            lane1.start();
            lane2.start();
        } else {
            const match = regex.exec(dataString);
            if (match !== null && match.length >= 3) {
                const seconds = parseFloat(match[2]);                
                if (match[1] == "1 - ") {
                    log('Lane 1', seconds);
                    lane1.stop();
                    lane1.updateTime(seconds);
                } else if (match[1] == "2 - ") {
                    log('Lane 2', seconds);
                    lane2.stop();
                    lane2.updateTime(seconds);
                }

                if (!bestTime || seconds < bestTime) {
                    log('New best time', { new: seconds, old: bestTime });
                    bestTime = seconds;
                    best.updateTime(seconds);
                }
            }
        } 
    });

    port.on('error', function(err) {
        log('Error: ', err.message);
    })
}

var closePort = function(callback) {
    if (port) {
        port.close((error) => {
            if (error) {
                log('Close error', error);
            }
            else {
                log('Port closed');
                if (callback) callback();
            }
        });
    }
    else {
        if (callback) callback();
    }
}

serialport.list(function(err, ports) {
    log('Available ports', ports);
});

window.addEventListener('unload', function(event) {
    closePort();
});

$gear.addEventListener('click', function() {
    if ($setup.style.display == "none") {
        $timer.style.display = "none";
        $setup.style.display = "block";
    } else {
        $setup.style.display = "none";
        $timer.style.display = "block";
    }
});

$connection.addEventListener('click', function() {
    portOptions = {
        baudRate: parseInt(document.getElementById('baud').value),
        databits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false,
    };

    closePort(function() {
        var nameText = document.getElementById('name').value;
        log('Trying to connect to ' + nameText);
        port = new serialport(nameText, portOptions);
        port.on('open', openPort);
    });
});


document.onkeypress = function(e) {
    e = e || window.event;
    var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
    switch(charCode){
        case 61:
            zoomFactor += .1;
            webFrame.setZoomFactor(zoomFactor);
            break;
        case 45:
            zoomFactor -= .1;
            webFrame.setZoomFactor(zoomFactor);
            break;
    }
};