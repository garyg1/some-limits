var canvas;
var ctx;
var width;
var height;
var selectedPoint;
var highlightedPoint;
var selectedCurveIndex;
var selectedSplineColor = 'black';
var menuHidden = false;
var menu;
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
    menu = document.getElementById("menu");
    width = canvas.width;
    height = canvas.height;
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchstart", onTouchDown);
    window.addEventListener("touchend", onTouchUp);
    window.addEventListener("touchcancel", onTouchUp);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("contextmenu", function (ev) {
        ev.preventDefault();
    });
    window.addEventListener('resize', function () {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        window.requestAnimationFrame(draw);
    });
    var hideButton = document.getElementById("hide");
    hideButton.addEventListener("click", showHideMenu);
    var showButton = this.document.getElementById("show");
    showButton.addEventListener("click", showHideMenu);
    var clearButton = document.getElementById("clear");
    clearButton.addEventListener("click", clear);
    requestAnimationFrame(draw);
};
function showHideMenu() {
    menuHidden = !menuHidden;
    if (menuHidden) {
        menu.classList.add("hidden");
    }
    else {
        menu.classList.remove("hidden");
    }
}
function onMouseDown(event) {
    handleMouseDown(event.offsetX, event.offsetY, event.buttons);
}
function onTouchDown(event) {
    var touches = event.touches;
    handleMouseDown(touches[0].clientX, touches[0].clientY);
}
function handleMouseDown(x, y, buttons) {
    var target = spline.getNearestPoint(x, y, distThresh);
    if (buttons && buttons % 4 >= 2) {
        if (target) {
            spline.removePoint(target);
        }
        else {
            spline.insertPoint(x, y);
        }
    }
    else if ((!buttons) || (buttons && buttons % 2 == 1)) {
        if (target) {
            selectedPoint = target;
        }
        else {
            spline.addPoint(x, y);
        }
    }
    requestAnimationFrame(draw);
}
function onMouseMove(event) {
    console.log("ON MOUSE MOVE", event.buttons);
    handleMouseMove(event.offsetX, event.offsetY, false);
}
function onTouchMove(event) {
    var touches = event.touches;
    handleMouseMove(touches[0].clientX, touches[0].clientY, true);
}
function handleMouseMove(x, y, isTouchEvent) {
    console.log("MOUSEMOVE:", isTouchEvent);
    var doDraw = false;
    if (isTouchEvent) {
        selectedCurveIndex = -1;
    }
    else {
        var closestCurve = spline.getNearestCurve(x, y);
        if (closestCurve.index != selectedCurveIndex) {
            selectedCurveIndex = closestCurve.index;
            doDraw = true;
        }
    }
    if (selectedPoint) {
        selectedPoint.i = x;
        selectedPoint.j = y;
        spline.setcurve();
        doDraw = true;
    }
    var target = spline.getNearestPoint(x, y, distThresh);
    if (target) {
        if (!target.equals(highlightedPoint)) {
            highlightedPoint = target;
            doDraw = true;
        }
    }
    else if (highlightedPoint) {
        highlightedPoint = undefined;
        doDraw = true;
    }
    if (doDraw)
        window.requestAnimationFrame(draw);
}
function onMouseUp() {
    selectedPoint = undefined;
    window.requestAnimationFrame(draw);
}
function onTouchUp() {
    console.log("TOUCHUP", selectedCurveIndex);
    selectedPoint = undefined;
    selectedCurveIndex = -1;
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
    drawLine(spline.curve());
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
function drawLine(solution) {
    for (var n = 0; n < solution.curves.length; n++) {
        var color = splineColor;
        if (n == selectedCurveIndex) {
            color = selectedSplineColor;
        }
        for (var t = 0; t < 1; t += 0.001) {
            var j = solution.curves[n].a0[0] + solution.curves[n].a1[0] * t
                + solution.curves[n].a2[0] * t * t + solution.curves[n].a3[0] * t * t * t;
            var i = solution.curves[n].a0[1] + solution.curves[n].a1[1] * t
                + solution.curves[n].a2[1] * t * t + solution.curves[n].a3[1] * t * t * t;
            putPixel(i, j, color);
        }
    }
}
