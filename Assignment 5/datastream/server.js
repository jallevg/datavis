const express = require('express');
const app = express();
const request = require('request');
app.use(express.json());

app.listen(8000, () => {
    console.log('Server started!');
    getData();
    getExchangeRates();
    setInterval(changedataToSend, 1000);
    setInterval(sendUDP, 1000);
});
//send OSC message
var osc = require("osc");
var udpPort = new osc.UDPPort({
    metadata: true,
    remotePort: 12000,
    remoteAddress: "127.0.0.1"
});

udpPort.open();

udpPort.on("error", function (error) {
    console.log("An error occurred: ", error.message);
});

function sendUDP() {
    udpPort.send({
        address: "/number",
        args: {
            type: "f",
            value: dataToSend
        }
    });

    udpPort.send({
        address: "/exchangerate",
        args: [{
            type: "f",
            value: eur
        }, {
            type: "f",
            value: jpy
        }, {
            type: "f",
            value: btc
        }, {
            type: "f",
            value: gpb
        }]
    });

    udpPort.send({
        address: "/minmax",
        args: [{
            type: "f",
            value: min
        }, {
            type: "f",
            value: max
        }]
    });
}

//api key: OZV5M9AT5WT8IM15
//https://www.alphavantage.co/
var datastream = 'TIME_SERIES_INTRADAY';
var company = 'MSFT';
var interval = '1min';

var dataToSend = 0;
var indexCounter;
var RealTimeData = [];

var ApiKeys = ['5NXUYX3JA52LHZLR', '5NXUYX3JA52LHZLR', '802NUQMS422UQW7H', '802NUQMS422UQW7H'];
var exchangerates = [];
var currencyFrom = 'USD';
var eur = 0;
var jpy = 0;
var btc = 0;
var gpb = 0;
var min = 0;
var max = 0;
//getExchangeRates();
//getData();
//setInterval(changedataToSend, 1000);
//setInterval(getExchangeRates, 1000);
//setInterval(function(){console.log(exchangerates)}, 1000);

function getData() {
    request('https://www.alphavantage.co/query?function=' + datastream + '&symbol=' + company + '&interval=' + interval + '&apikey=OZV5M9AT5WT8IM15', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        procesData(body);
        //console.log(body)
    });
}

function getExchangeRates() {

    request(' https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=' + currencyFrom + '&to_currency=EUR&apikey=5NXUYX3JA52LHZLR', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        } else {
           eur = body['Realtime Currency Exchange Rate']['5. Exchange Rate'];
        }
    });

    request(' https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=' + currencyFrom + '&to_currency=CNY&apikey=5NXUYX3JA52LHZLR', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        } else {
           jpy = body['Realtime Currency Exchange Rate']['5. Exchange Rate'];
        }
    });

    request(' https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=' + currencyFrom + '&to_currency=AUD&apikey=802NUQMS422UQW7H', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        } else {
           btc = body['Realtime Currency Exchange Rate']['5. Exchange Rate'];
        }
    });

    request(' https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=' + currencyFrom + '&to_currency=GBP&apikey=802NUQMS422UQW7H', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        } else {
           gpb = body['Realtime Currency Exchange Rate']['5. Exchange Rate'];
        }
    });
}

function procesData(d) {
    RealTimeData = [];
    var minutes = d["Time Series (1min)"];
    for (let minute in minutes) {
        RealTimeData.push(minutes[minute]["2. high"]);
    }
    indexCounter = RealTimeData.length - 1;
    max = Math.max(...RealTimeData);
    min = Math.min(...RealTimeData);
}

function changedataToSend() {
    dataToSend = RealTimeData[indexCounter];
    if (indexCounter == 0) {
        getData();
        return;
    }
    indexCounter--;
    //console.log(dataToSend)
    // sendUDP();
}

app.route('/api/stockdata').get((req, res) => {
    res.send('' + dataToSend + '');
});

app.route('/api/exchangerate').get((req, res) => {
    res.send([exchangerates]);
});