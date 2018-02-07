var canvas;
var ctx;
var width;
var height;

var spline = new Spline();

window.onload = function() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.addEventListener("click", function(ev) {
        spline.addPoint(ev.offsetX, ev.offsetY);
        draw();
    });
    draw();
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    

    width = canvas.width;
    height = canvas.height;

    spline.points.forEach((point) => {
        drawCircle(point.i, point.j, 3);
    });


    ctx.fillStyle = "black";
    drawLine(spline.curve);
}

/**
 * 
 * @param {Number} i The i-coordinate of the center.
 * @param {Number} j The j-coordinate of the center.
 * @param {Number} radius The radius.
 */
function drawCircle(i, j, radius) {
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

    let step = 0.001;
    for (let n = 0; n < spline.points.length - 1; n++) {
        for (let t = 0; t < 1; t += 0.001) {
            var j = params.A[n][0] + params.B[n][0] * t + params.C[n][0] * t*t + params.D[n][0] * t*t*t;
            var i = params.A[n][1] + params.B[n][1] * t + params.C[n][1] * t*t + params.D[n][1] * t*t*t;
            putPixel(i, j, data, 255);
        }
    }
    ctx.putImageData(imageData, 0, 0);
}
