var canvas;
var ctx;
var width;
var height;
var selectedPoint;
var highlightedPoint;
var selectedCurveIndex;
var menuHidden = false;
var menu;
var pointRadius = 8;
var distThresh = 40;
var backgroundColor = 'seagreen';
var pointColor = 'rgba(255, 255, 255, 1)';
var highlightedColor = 'rgba(255, 255, 255, 0.5)';
var selectedColor = 'rgba(100, 255, 210, 0.5)';
var splineColor = 'white';
var selectedSplineColor = 'rgba(255, 255, 255, 0.5)';
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
    canvas.addEventListener("mouseout", function (e) {
        selectedPoint = undefined;
        highlightedPoint = undefined;
        selectedCurveIndex = -1;
        window.requestAnimationFrame(draw);
    });
    canvas.addEventListener("touchstart", onTouchDown);
    canvas.addEventListener("touchend", onTouchUp);
    canvas.addEventListener("touchcancel", onTouchUp);
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
    handleMouseMove(event.offsetX, event.offsetY, false);
}
function onTouchDown(event) {
    event.preventDefault();
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
}
function onMouseMove(event) {
    handleMouseMove(event.offsetX, event.offsetY, false);
}
function onTouchMove(event) {
    event.preventDefault();
    var touches = event.touches;
    handleMouseMove(touches[0].clientX, touches[0].clientY, true);
}
function handleMouseMove(x, y, isTouchEvent) {
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
    else {
        var target = spline.getNearestPoint(x, y, distThresh);
        if (target && !isTouchEvent) {
            if (!target.equals(highlightedPoint)) {
                highlightedPoint = target;
                doDraw = true;
            }
        }
        else if (highlightedPoint) {
            highlightedPoint = undefined;
            doDraw = true;
        }
    }
    if (doDraw)
        window.requestAnimationFrame(draw);
}
function onMouseUp(event) {
    selectedPoint = undefined;
    handleMouseMove(event.offsetX, event.offsetY, false);
}
function onTouchUp(event) {
    event.preventDefault();
    selectedPoint = undefined;
    highlightedPoint = undefined;
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
    ctx.fillRect(i, j, 2, 2);
}
function drawLine(solution) {
    for (var n = 0; n < solution.curves.length; n++) {
        var color = splineColor;
        if (!highlightedPoint && n == selectedCurveIndex) {
            color = selectedSplineColor;
        }
        var curve = solution.curves[n];
        var dt = 0;
        for (var t = 0; t < 1; t += dt) {
            var i = curve.a0[0] + curve.a1[0] * t
                + curve.a2[0] * t * t + curve.a3[0] * t * t * t;
            var j = curve.a0[1] + curve.a1[1] * t
                + curve.a2[1] * t * t + curve.a3[1] * t * t * t;
            var di = curve.a1[0] + 2 * curve.a2[0] * t
                + 3 * curve.a3[0] * t * t;
            var dj = curve.a1[1] + 2 * curve.a2[1] * t
                + 3 * curve.a3[1] * t * t;
            dt = Math.min(1 / Math.abs(di), 1 / Math.abs(dj));
            putPixel(i, j, color);
        }
    }
}
