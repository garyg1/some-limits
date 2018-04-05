var canvas;
var ctx;
var width;
var height;
var selectedPoint;
var highlightedPoint;
var pointRadius = 12;
var distThresh = 20;
var pointColor = 'rgba(255, 255, 255, 1)';
var selectedColor = 'rgba(255, 255, 255, 0.33)';
var highlightedColor = 'rgba(255, 255, 255, 0.66)';
var backgroundColor = 'seagreen';
var splineColor = 'white';
var spline = new Spline();
window.onload = function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("contextmenu", function (ev) {
        ev.preventDefault();
    });
    window.addEventListener('resize', function () {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        window.requestAnimationFrame(draw);
    });
    var undoButton = document.getElementById("undo");
    undoButton.addEventListener("click", undo);
    var clearButton = document.getElementById("clear");
    clearButton.addEventListener("click", clear);
    requestAnimationFrame(draw);
};
function onMouseDown(event) {
    var target = spline.getNearestPoint(event.offsetX, event.offsetY, distThresh);
    if (event.buttons % 4 >= 2) {
        if (target) {
            spline.removePoint(target);
        }
        else {
            insertPoint(event);
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
        spline.setcurve();
        window.requestAnimationFrame(draw);
    }
    var target = spline.getNearestPoint(event.offsetX, event.offsetY, distThresh);
    if (target) {
        if (!target.equals(highlightedPoint)) {
            highlightedPoint = target;
            window.requestAnimationFrame(draw);
        }
    }
    else if (highlightedPoint) {
        highlightedPoint = undefined;
        window.requestAnimationFrame(draw);
    }
}
function onMouseUp(event) {
    selectedPoint = undefined;
    window.requestAnimationFrame(draw);
}
function addPoint(event) {
    spline.addPoint(event.offsetX, event.offsetY);
    window.requestAnimationFrame(draw);
}
function insertPoint(event) {
    spline.insertPoint(event.offsetX, event.offsetY);
    window.requestAnimationFrame(draw);
}
function undo() {
    spline.removeLastPoint();
    window.requestAnimationFrame(draw);
}
function clear() {
    spline = new Spline();
    window.requestAnimationFrame(draw);
}
function draw() {
    if (ctx.canvas.width != window.innerWidth || ctx.canvas.height != window.innerHeight) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
    }
    width = canvas.width;
    height = canvas.height;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    drawLine(spline.spline);
    spline.points.forEach(function (point) {
        var color = pointColor;
        if (point.equals(highlightedPoint)) {
            color = highlightedColor;
        }
        if (point.equals(selectedPoint)) {
            color = selectedColor;
        }
        drawCircle(point.i, point.j, pointRadius, color);
    });
}
function drawCircle(i, j, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(i, j, radius, 0, 2 * Math.PI);
    ctx.fill();
}
function putPixel(i, j, color) {
    i = Math.floor(i);
    j = Math.floor(j);
    ctx.fillStyle = color;
    ctx.fillRect(j, i, 1, 1);
}
function drawLine(params) {
    for (var n = 0; n < spline.points.length - 1; n++) {
        for (var t = 0; t < 1; t += 0.001) {
            var j = params.A[n][0] + params.B[n][0] * t + params.C[n][0] * t * t + params.D[n][0] * t * t * t;
            var i = params.A[n][1] + params.B[n][1] * t + params.C[n][1] * t * t + params.D[n][1] * t * t * t;
            putPixel(i, j, splineColor);
        }
    }
}
