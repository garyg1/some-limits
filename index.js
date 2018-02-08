var canvas;
var ctx;
var width;
var height;

var selectedPoint;
var highlightedPoint;
var pointRadius = 6;
var distThresh = 20;
var pointColor = 'white';
var selectedColor = 'blue';
var highlightedColor = 'seagreen';


var spline = new Spline();

window.onload = function() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    width = canvas.width;
    height = canvas.height;

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp)
    canvas.addEventListener("mousemove", onMouseMove);

    canvas.addEventListener("contextmenu", function(ev) {
        ev.preventDefault();
    });

    window.addEventListener('resize', function() {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;

        draw();
    });


    let undoButton = document.getElementById("undo");
    undoButton.addEventListener("click", undo);

    let clearButton = document.getElementById("clear");
    clearButton.addEventListener("click", clear);


    requestAnimationFrame(draw);
}

/**
 * 
 * @param {MouseEvent} event A MouseEvent.
 */
function onMouseDown(event) {
    let target = spline.getNearestPoint(event.offsetX, event.offsetY, distThresh);

    // if right-button pressed
    if (event.buttons % 4 >= 2) {
        
        if (target) {
            spline.removePoint(target);
        }
    }

    else if (event.buttons % 2 == 1) {
        if (target) {
            selectedPoint = target;
        }
        else {
            addPoint(event);
        }
    }

    requestAnimationFrame(draw);
}

function onMouseMove(event) {
    if (selectedPoint) {
        selectedPoint.i = event.offsetX;
        selectedPoint.j = event.offsetY;
    }

    let target = spline.getNearestPoint(event.offsetX, event.offsetY, distThresh);
    if (target) {
        highlightedPoint = target;
    } 
    else {
        highlightedPoint = undefined;
    }

    requestAnimationFrame(draw);
}

function onMouseUp(event) {
    selectedPoint = undefined;
    requestAnimationFrame(draw);
}


function addPoint(event) {
    spline.addPoint(event.offsetX, event.offsetY);
}

function undo() {
    spline.removeLastPoint();
    requestAnimationFrame(draw);
}

function clear() {
    spline = new Spline();
    requestAnimationFrame(draw);
}

function draw() {

    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    width = canvas.width;
    height = canvas.height;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    
    drawLine(spline.curve);
    
    spline.points.forEach((point) => {
        let color = pointColor;
        if (point.equals(highlightedPoint)) {
            color = highlightedColor;
        }

        if (point.equals(selectedPoint)) {
            color = selectedColor;
        }
          
        drawCircle(point.i, point.j, pointRadius, color); 
    });

}

/**
 * 
 * @param {Number} i The i-coordinate of the center.
 * @param {Number} j The j-coordinate of the center.
 * @param {Number} radius The radius.
 */
function drawCircle(i, j, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(i, j, radius, 0, 2*Math.PI);
    ctx.fill();
}

function putPixel(i, j, data, val) {
    i = Math.floor(i);
    j = Math.floor(j);

    data[4*(i*width + j)] = val;
    data[4*(i*width + j) + 3] = 255;
}

function drawLine(params) {
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;

    for (let n = 0; n < spline.points.length - 1; n++) {
        for (let t = 0; t < 1; t += 0.001) {
            var j = params.A[n][0] + params.B[n][0] * t + params.C[n][0] * t*t + params.D[n][0] * t*t*t;
            var i = params.A[n][1] + params.B[n][1] * t + params.C[n][1] * t*t + params.D[n][1] * t*t*t;
            putPixel(i, j, data, 255);
        }
    }
    ctx.putImageData(imageData, 0, 0);
}
