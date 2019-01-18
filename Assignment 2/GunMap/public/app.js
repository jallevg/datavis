var parseDate = d3.timeParse("%d-%b-%y");
var hourFormater = d3.timeFormat("%B %d, %Y");

var data = {};
var sets = {};
var currentData = [];
var currentType, currentColor, totalCurrentType, currentDataType;
var currentInicdents;
var colors = [105, 280, 39, 4, 218];
totalUS = {};

var datarequest = new XMLHttpRequest();
datarequest.open('GET', '/data', true);
datarequest.onload = function () {
    var settingrequest = new XMLHttpRequest();
    settingrequest.open('GET', '/settings', true);
    var that = this;
    settingrequest.onload = function () {
        //load settings
        var settings = JSON.parse(this.response);
        //load data
        var iData = JSON.parse(that.response);

        //assign globals
        data = iData;
        sets = settings;

        //format data
        for (key of Object.keys(data)) {
            data[key] = formatObjects(data[key]);
            totalUS[key] = {
                victims: sum(data[key], 'victims'),
                killed: sum(data[key], 'killed'),
                injured: sum(data[key], 'injured')
            }
        }

        //assign default globals
        currentData = data.children;
        currentColor = colors[0];
        currentType = "victims";
        currentDataType = 'children';

        init();
    }
    settingrequest.send();
}
// Send request
datarequest.send();

//change data selection from legend
$('.dataset').click(function () {
    currentData = data[$(this).attr('title')];
    currentDataType = $(this).attr('title');
    currentColor = $(this).attr('id');
    reset();
})

$('.type').click(function () {
    currentType = $(this).attr('title');
    reset();
})

function init() {
    $('.dataset').each(function (i, obj) {
        $(this).prepend('<svg width="40" height="10" class="legendRect"><rect width="40" height="10" style="fill:hsl(' + colors[i] + ',100%,50%);stroke-width:3;stroke:rgb(0,0,0)" /></svg>');
        $(this).attr("id", colors[i]);
    });
    reset();
}

function reset() {
    drawMap();
    $('#timeTable').remove();
    $(".info").remove();
    $('.legendTypeRect').remove();
    $('.type').each(function () {
        $(this).attr("title") == currentType ? fill = "black" : fill = "white";
        $(this).prepend('<svg width="40" height="10" class="legendTypeRect legendRect"><rect width="40" height="10" style="fill:' + fill + ';stroke-width:3;stroke:rgb(0,0,0)" /></svg>')
    });
    fillUsTotal();
}
//function for sum
function sum(arr, key) {
    let res = 0;
    for (e of arr) {
        res += e[key];
    }
    return res;
}

//map function https://stackoverflow.com/questions/5649803/remap-or-map-function-in-javascript
function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

//filter state from data
function filterByState(arr, state) {
    return arr.filter(el => el.state == state);
}

//remove incidents lacking currentType
function removeZero(arr) {
    return arr.sort().filter(function (i) {
        return i[currentType]
    });
}

//sort array by key https://stackoverflow.com/questions/8837454/sort-array-of-objects-by-single-key-with-date-value
function sortByKey(array, key) {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

//format objects for d3
function formatObjects(arr) {

    return arr.map(d => {
        return {
            date: parseDate(d.incidentDate),
            state: d.state,
            cityOrCounty: d.cityOrCounty,
            address: d.address,
            killed: Number(d.killed),
            injured: Number(d.injured),
            victims: Number(d.killed) + Number(d.injured),
            operations: d.operations,
            type: d.type,
            age: d.age
        }
    });
}

//set color of map
function setMapColor(state) {
    // return "hsl(" + map(sum(filterByState(currentData, state), currentType), 0, getMaxOfState(), 100, 0) + ", 100%, 50%)"
    return "hsl(" + currentColor + ", 100%, " + map(sum(filterByState(currentData, state), currentType), 0, getMaxOfState(), 80, 20) + "%)"
}

//calculate max amount of victims of currentType from all states
function getMaxOfState() {
    let res = [];
    let unique = [...new Set(currentData.map(item => item.state))];
    for (u of unique) {
        res.push(sum(filterByState(currentData, u), currentType));
    }
    return _.max(res, function (d) {
        return d;
    });
}

//draw map
function drawMap() {

    $('#mapUS').remove();

    var svg = d3.select("#vis").append("svg").attr("id", "mapUS").attr("width", window.innerWidth / 2).attr("height", window.innerHeight);

    var chartGroup = svg.append("g");

    var path = d3.geoPath();

    d3.json("map", function (error, us) {
        if (error) throw error;

        chartGroup.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append("path")
            .attr("stroke", "white")
            .attr("d", path)
            .attr("id", function (d) {
                return d.id;
            })
            .attr("fill", function (d) {
                return setMapColor(d.id)
            })
            .on('click', function (d) {
                totalCurrentType = sum(filterByState(currentData, d.id), currentType)
                drawTimeTable(removeZero(filterByState(currentData, d.id)));
            });
    });
}

//draw state incident timeline
function drawTimeTable(selectedData) {

    //sort data by date for timeline
    selectedData = sortByKey(selectedData, 'date');

    //set global
    currentInicdents = selectedData.length;

    //remove previous timeline
    $('#timeTable').remove();

    //set margins and define width and height for timeline
    var margin = {
        top: 10,
        right: 100,
        bottom: 100,
        left: 10
    };

    var height = 800;
    var width = 200;

    //define scale and axis
    var y = d3.scalePoint()
        .domain(selectedData.map(e => hourFormater(e.date)))
        .rangeRound([0, height])
        .padding(0);

    var yAxis = d3.axisRight(y).tickPadding(16).tickSize(20);

    //append svg and axis
    var svg = d3.select("#vis").append("svg").attr("id", "timeTable").attr("height", "" + height + margin.bottom + "").attr("width", "" + width + "");

    var chartGroup = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    chartGroup.append("g").attr("class", "yaxis").call(yAxis);

    //make labels clickable
    d3.select('.yaxis')
        .selectAll('g.tick')
        .on('click', function (d) {
            fillExtraStateInfo(selectedData.filter(e => {
                return hourFormater(e.date) == d
            })[0]);
        })

    //draw timeline
    chartGroup.selectAll("dots")
        .data(selectedData)
        .enter().append("svg:circle")
        .attr("cx", function (d, i) {
            return 0
        })
        .attr("cy", function (d) {
            return y(hourFormater(d.date));
        })
        .attr("r", function (d) {
            return 5;
            // return d[currentType] * 5
        })
        .attr("class", "dots")
        .attr("fill", "white")
        .attr("stroke", "black")
        .on('click', function (d) {
            fillExtraStateInfo(d);
        });

    //fill extra information with generic state info
    fillExtraStateInfo({
        state: selectedData[0].state,
        killed: "",
        injured: "",
        cityOrCounty: "",
        type: "",
        address: ""
    });
}

//fill list with extra info about the current incident
function fillExtraStateInfo(d) {
    fillUsTotal();
    var html = "<p class='info'><span>State \xa0  </span> " + d.state + "</p> <p class='info'><span>#Incidents \xa0 </span>" + currentInicdents + "</p>  <p class='info lastStateInfo noConnection'><span>total #" + currentType + " \xa0 </span>" + totalCurrentType + "</p>"
    html += " <p class='info'><span>City \xa0 </span> " + d.cityOrCounty + "</p> <p class='info'><span>address \xa0 </span> " + d.address + "</p>"
    html += "<p class='info'><span>#killed \xa0 </span> " + d.killed + "</p> <p class='info'><span>#injured \xa0 </span> " + d.injured + "</p> "
    html += "<p class='info'><span>Type \xa0 </span>" + d.type + "</p> "
    $(".info").remove();
    $("#vis").append(html);
}

//fill list with total of current incident
function fillUsTotal() {
    var html = " <p class='lastStateInfo noConnection'><span>Total #" + currentType + " in the US \xa0 </span> " + totalUS[currentDataType][currentType] + "</p> ";
    $('.lastStateInfo').remove();
    $("#vis").append(html);
}