//On document load canvases dimension are set and stroke preconfigured
$(document).ready(function () {
    $(canvas).each(function () {
        var parentWidth = $(this).parent().outerWidth();
        var parentHeight = $(this).parent().outerHeight();
        $(this).attr('width', parentWidth);
        $(this).attr('height', parentHeight);
    })
    canvas.hidden = true;

    ctx.strokeStyle = "red";
    ctx.lineCap = "round";
    ctx.lineWidth = 10;

    $(cursor).each(function () {
        var parentWidth = $(this).parent().outerWidth();
        var parentHeight = $(this).parent().outerHeight();
        $(this).attr('width', parentWidth);
        $(this).attr('height', parentHeight);
    })
    cursor.hidden = true;
    $(display).each(function () {
        var parentWidth = $(this).parent().outerWidth();
        var parentHeight = $(this).parent().outerHeight();
        $(this).attr('width', parentWidth);
        $(this).attr('height', parentHeight);
    })

    drawTool();
});

//building connection with hub
var connection = new signalR.HubConnectionBuilder().withUrl("/documentHub", {
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets //setting transport to WebSockets
}).build();


connection.on("newStroke", drawStroke); //bind function to websocket message
connection.on("clearCanvas", reset); //bind function to websocket message

//actions on connection start
connection.start()
    .then(() => console.log('connected!'))
    .catch(err => console.error)


var unsentStrokes = [];

var canvas = document.getElementById('draw-canvas');
var cursor = document.getElementById('cursor-canvas');
var display = document.getElementById('display-canvas');

var ctx = canvas.getContext('2d');
var cursorctx = cursor.getContext('2d');
var displayctx = display.getContext('2d');


var penDown = false;
var eraserOn = false;
var previous = { x: 0, y: 0 };


var toolbarEmpty = document.getElementById('toolbar-empty');

//if empty part of toolbar clicked - hide line width bar (if visible)
toolbarEmpty.addEventListener('mousedown', () => {
    if (rangeContainer.style.zIndex == 100) {
        rangeContainer.style.zIndex = -100;
    }
});


function update(mouseX, mouseY) {
    cursorctx.beginPath();
    cursorctx.arc(mouseX, mouseY, ctx.lineWidth / 2, 0, 2 * Math.PI, true);
    cursorctx.stroke();

    requestAnimationFrame(update);
}

//track that mouse button is down inside canvas
display.addEventListener('mousedown', ev => {
    penDown = true;

    //if canvas clicked - hide line width bar (if visible)
    if (rangeContainer.style.zIndex == 100) {
        rangeContainer.style.zIndex = -100;
    }
});

//track that mouse button is up on all page
document.addEventListener('mouseup', ev => { penDown = false; });

//track mouse movement on canvas
display.addEventListener('mousemove', ev => {
    cursorctx.clearRect(0, 0, cursor.width, cursor.height);
    if (eraserOn) {
        var mousePos = {
            x: ev.pageX - display.offsetLeft,
            y: ev.pageY - display.offsetTop
        }

        update(mousePos.x, mousePos.y);
    }

    if (penDown) {
        var start = {
            x: previous.x - display.offsetLeft,
            y: previous.y - display.offsetTop
        }
        var end = {
            x: ev.pageX - display.offsetLeft,
            y: ev.pageY - display.offsetTop
        }

        if (eraserOn) {
            //draw white stroke if eraser is on
            drawStroke(start, end, '#FFFFFF');

            //add new strokes
            unsentStrokes.push({
                start: start,
                end: end,
                color: '#FFFFFF',
                width: ctx.lineWidth
            })
        }
        else {
            //draw stroke
            drawStroke(start, end, color.value);

            //add new strokes
            unsentStrokes.push({
                start: start,
                end: end,
                color: color.value,
                width: ctx.lineWidth
            })
        }

    }
    //update canvas
    displayctx.clearRect(0, 0, display.width, display.height);
    displayctx.drawImage(canvas, 0, 0);
    displayctx.drawImage(cursor, 0, 0);

    previous = {
        x: ev.pageX,
        y: ev.pageY
    };
});

//If mouse leaves canvas - update canvas. Just to hide eraser cursor
display.addEventListener('mouseleave', ev => { displayctx.clearRect(0, 0, display.width, display.height); displayctx.drawImage(canvas, 0, 0); });

//draw the stroke
function drawStroke(start, end, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

var drawToolEl = document.getElementById('drawing-tools');
var eraserTool = document.getElementById('eraser');

//set tool to 'draw tool'
function drawTool() {
    eraserOn = false;

    display.style.cursor = "crosshair";
    
    drawToolEl.style.backgroundColor = "3090fa";
    eraserTool.style.backgroundColor = "959595";

    if (rangeContainer.style.zIndex == 100) {
        rangeContainer.style.zIndex = -100;
    }
}

//set tool to 'eraser tool'
function eraser() {
    eraserOn = true;

    display.style.cursor = "none";

    ctx.strokeStyle = "white";

    drawToolEl.style.backgroundColor = "959595";
    eraserTool.style.backgroundColor = "3090fa";

    if (rangeContainer.style.zIndex == 100) {
        rangeContainer.style.zIndex = -100;
    }
}

var rangeContainer = document.getElementById('range');
var range = document.getElementById('width-range');
var valueField = document.getElementById('width-value');

//display chosen width and set it to stroke
range.addEventListener("input", () => {
    valueField.innerHTML = range.value;
    ctx.lineWidth = range.value;
});

//display line width bar
function lineWidth() {
    if (rangeContainer.style.zIndex == 100) {
        rangeContainer.style.zIndex = -100;
    }
    else {
        rangeContainer.style.zIndex = 100;
    }
}

var color = document.getElementById("color-picker");

//send 'clear canvas' action to all other users
function sendReset() {
    connection.send('ClearCanvas');
}

//clear canvas
function reset() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    displayctx.clearRect(0, 0, display.width, display.height);

    if (rangeContainer.style.zIndex == 100) {
        rangeContainer.style.zIndex = -100;
    }
}

//send new strokes every 250ms
setInterval(function () {
    if (unsentStrokes.length) {
        connection.send('NewStrokes', unsentStrokes);
        unsentStrokes = [];
    }
}, 250);

//update canvas every 50ms
setInterval(function () {
    displayctx.clearRect(0, 0, display.width, display.height);
    displayctx.drawImage(canvas, 0, 0);
    displayctx.drawImage(cursor, 0, 0);
}, 50);