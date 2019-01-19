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

//send OSC message with UDP
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
//variables for api
var dataToSend = 0;
var indexCounter;
var RealTimeData = [];

var eur = 0;
var jpy = 0;
var btc = 0;
var gpb = 0;
var min = 0;
var max = 0;

//var for reading json response
const firstLevelExchange = 'Realtime Currency Exchange Rate';
const categoryOfExchange = '5. Exchange Rate';

const firstLevelStock = "Time Series (1min)";
const categoryOfStock = "2. high";


//get current stockvalue of selected company
function getData() {
    request('https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=1min&apikey=OZV5M9AT5WT8IM15', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        procesData(body);
        //console.log(body)
    });
}

//get exchangerates for certain currencies
function getExchangeRates() {

    request(' https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=5NXUYX3JA52LHZLR', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        } else {
           eur = body[firstLevelExchange][categoryOfExchange];
        }
    });

    request(' https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=CNY&apikey=5NXUYX3JA52LHZLR', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        } else {
           jpy = body[firstLevelExchange][categoryOfExchange];
        }
    });

    request(' https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=AUD&apikey=802NUQMS422UQW7H', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        } else {
           btc = body[firstLevelExchange][categoryOfExchange];
        }
    });

    request(' https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=GBP&apikey=802NUQMS422UQW7H', {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        } else {
           gpb = body[firstLevelExchange][categoryOfExchange];
        }
    });
}

//reformat the data from the getData JSON response
//Read data and push relevant info into array

function procesData(d) {
    RealTimeData = [];
    var minutes = d[firstLevelStock];
    for (let minute in minutes) {
        RealTimeData.push(minutes[minute][categoryOfStock]);
    }
    indexCounter = RealTimeData.length - 1;
    max = Math.max(...RealTimeData);
    min = Math.min(...RealTimeData);
}

//send a new number every second
//when the end is reached get new data
function changedataToSend() {
    dataToSend = RealTimeData[indexCounter];
    if (indexCounter == 0) {
        getData();
        return;
    }
    indexCounter--;
}