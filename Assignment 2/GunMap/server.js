const express = require('express')
const app = express()
const port = 3000
const path = require("path");
const csv = require("csvtojson");
var jsondata = undefined;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/app', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/app.js'));
});

app.get('/font', function (req, res) {
    res.sendFile(path.join(__dirname + '/data/font.otf'));
});

app.get('/settings', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/settings.json'));
});

app.get('/map', function (req, res) {
    res.sendFile(path.join(__dirname + '/data/map.json'));
});

app.get('/data', function (req, res) {
    const data = {};
    data.children = children;
    data.teens = teens;
    data.adults = adults;
    data.mass = mass;
    data.officer = officer;
    res.send(data);
})

let init = () => {
    csv()
        .fromFile("./data/children.csv")
        .then((parsed) => {
            children = parsed;
        })
    csv()
        .fromFile("./data/teens.csv")
        .then((parsed) => {
            teens = parsed;
        })
    csv()
        .fromFile("./data/massShootings.csv")
        .then((parsed) => {
            mass = parsed;
        })
    csv()
        .fromFile("./data/officer.csv")
        .then((parsed) => {
            officer = parsed;
        })
    csv()
        .fromFile("./data/adults.csv")
        .then((parsed) => {
            adults = parsed;
            app.listen(port, () => console.log(`Gunviolence Map app listening on port ${port}!`));
        })
};

init();