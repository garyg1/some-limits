var canvas;
var ctx;

var s = new Spline();

s.addPoint(1, 2);
s.addPoint(4, 3);
s.addPoint(3, 3);
s.addPoint(1, 1);
console.log(s.curve);

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');

    draw();
}



function draw() {
    
}