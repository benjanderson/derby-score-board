const serialport = require('serialport')
const timespan = require('timespan');

function timerNum(id) {
    var _this = this;
    var element = document.getElementById(id);
    var numbers = element.getElementsByClassName('num-item');
    var start;
    var tick;

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
        
        var decimal = ((seconds % 1) * 100).toString();
        var hours = Math.floor(seconds / 3600).toString();
        var minutes = Math.floor(seconds / 60).toString();
        var seconds = Math.floor(seconds % 60).toString();

        addClass(numbers[0], hours, 1);
        addClass(numbers[1], hours, 0);
        addClass(numbers[2], minutes, 1);
        addClass(numbers[3], minutes, 0);
        addClass(numbers[4], seconds, 1);
        addClass(numbers[5], seconds, 0);
        addClass(numbers[6], decimal, 1);
        addClass(numbers[7], decimal, 0);
    };  

    _this.start = function() {
        start = new Date();
        tick = setInterval(function() {
            var ts = timespan.fromDates(start, new Date());
            var seconds = ts.totalSeconds();
            console.log(seconds);
            _this.updateTime(seconds);
        }, 1);
    };

    _this.stop = function() {
        clearInterval(tick);
    };
}

const lane1 = new timerNum('lane1');
const lane2 = new timerNum('lane2');
const best = new timerNum('best');

serialport.list(function(err, ports) {
    console.log(ports);
    var port = new serialport(ports[1].comName, {
        baudRate:9600,
        databits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false,
    });

    window.addEventListener('unload', function(event) {
        port.close();
    });

    port.on('open', function () {
        const regex = /^(\d\W-\W)((?:\d|\.)+)/m;
        console.log('Port Opened', port);

        port.on('data', function(data) {
            var dataString = data.toString();
            console.log(dataString);
            if (dataString.length > 0 && dataString[0] === 'B') {
                console.log("started");
                lane1.start();
                lane2.start();
            } else {
                const match = regex.exec(dataString);
                if (match !== null && match.length >= 3) {
                    lane1.stop();
                    lane2.stop();
                    const seconds = parseFloat(match[2]);
                    if (match[1] == "1 - ") {
                        lane1.updateTime(seconds);
                    } else if (match[1] == "2 - ") {
                        lane2.updateTime(seconds);
                    }
                }
            } 
        });
    });

    port.on('error', function(err) {
        console.log('Error: ', err.message);
    })
});