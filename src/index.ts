let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let width: number;
let height: number;

let selectedPoint: Point;
let highlightedPoint: Point;
let selectedCurveIndex: number;


let menuHidden: boolean = false;
let menu: HTMLElement;

const pointRadius: number = 8;
const distThresh: number = 40;

const backgroundColor: string = 'seagreen';

const pointColor: string = 'rgba(255, 255, 255, 1)';
const highlightedColor: string = 'rgba(255, 255, 255, 0.5)';
const selectedColor: string = 'rgba(100, 255, 210, 0.5)';

const splineColor: string = 'white';
let selectedSplineColor: string = 'rgba(255, 255, 255, 0.5)';

var spline = new Spline();

window.onload = function() {
    canvas = <HTMLCanvasElement>document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    menu = document.getElementById("menu");

    width = canvas.width;
    height = canvas.height;

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp)
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseout", function(e) {
        selectedPoint = undefined;
        highlightedPoint = undefined;
        selectedCurveIndex = -1;
        window.requestAnimationFrame(draw);
    });

    canvas.addEventListener("touchstart", onTouchDown);
    canvas.addEventListener("touchend", onTouchUp);
    canvas.addEventListener("touchcancel", onTouchUp);
    canvas.addEventListener("touchmove", onTouchMove);

    canvas.addEventListener("contextmenu", function(ev) {
        ev.preventDefault();
    });

    window.addEventListener('resize', function() {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;

        window.requestAnimationFrame(draw);
    });

    let hideButton: HTMLElement = document.getElementById("hide");
    hideButton.addEventListener("click", showHideMenu);

    let showButton: HTMLElement = this.document.getElementById("show");
    showButton.addEventListener("click", showHideMenu);

    let clearButton: HTMLElement = document.getElementById("clear");
    clearButton.addEventListener("click", clear);


    requestAnimationFrame(draw);
}

function showHideMenu() {
    menuHidden = !menuHidden;

    if (menuHidden) {
        menu.classList.add("hidden");
    } else {
        menu.classList.remove("hidden");
    }
}

/**
 * Selects a point currently highlighted on left-click.
 * Deletes the currently highlighted point on right-click.
 * @param {MouseEvent} event A MouseEvent.
 */
function onMouseDown(event: MouseEvent) {
    handleMouseDown(event.offsetX, event.offsetY, event.buttons);
    handleMouseMove(event.offsetX, event.offsetY, false); // calls draw()
}

function onTouchDown(event: TouchEvent) {
    event.preventDefault(); // prevent mouse events

    const touches: TouchList = event.touches;
    handleMouseDown(touches[0].clientX, touches[0].clientY);
}

function handleMouseDown(x: number, y: number, buttons?: number) {

    let target = spline.getNearestPoint(x,y, distThresh);

    // if right-button pressed
    if (buttons && buttons % 4 >= 2) {
        if (target) {
            spline.removePoint(target);

        } else {
            spline.insertPoint(x, y);
        }
    
    // if is touch event or left-button pressed, add/select point
    } else if ((!buttons) || (buttons && buttons % 2 == 1)) {
        if (target) {
            selectedPoint = target;
        
        } else {
            spline.addPoint(x, y);

        }
    }
}


/**
 * If `selectedPoint`, moves the point with the mouse.
 * Checks if mousing over a point, and sets it as `highlightedPoint`.
 * @param {MouseEvent} event 
 */
function onMouseMove(event: MouseEvent) {
    handleMouseMove(event.offsetX, event.offsetY, false);
}

function onTouchMove(event: TouchEvent) {
    event.preventDefault(); // prevent mouse events

    const touches: TouchList = event.touches;
    handleMouseMove(touches[0].clientX, touches[0].clientY, true);
}

function handleMouseMove(x: number, y: number, isTouchEvent: boolean) {
    let doDraw: boolean = false;
    
    if (isTouchEvent) {
        selectedCurveIndex = -1;
    } else {
        const closestCurve: MinCurve = spline.getNearestCurve(x, y);

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
    
    } else {
        let target: Point = spline.getNearestPoint(x, y, distThresh);

        if (target && !isTouchEvent) {
            if (!target.equals(highlightedPoint)) {
                highlightedPoint = target;
                doDraw = true;
            }

        } else if (highlightedPoint) {        
            highlightedPoint = undefined;
            doDraw = true;
            
        }
    }

    if (doDraw) window.requestAnimationFrame(draw);
}

/**oB
 * Releases the current `selectedPoint`.
 * @param {MouseEvent} event A mouse event. 
 */
function onMouseUp(event: MouseEvent) {
    selectedPoint = undefined;
    handleMouseMove(event.offsetX, event.offsetY, false); // this also call draw()
}

function onTouchUp(event: TouchEvent) {
    event.preventDefault(); // prevent mouse events

    selectedPoint = undefined;
    highlightedPoint = undefined;
    selectedCurveIndex = -1;

    window.requestAnimationFrame(draw);
}


/**
 * Removes the last point from the spline and redraws.
 */
function undo() {
    spline.removeLastPoint();
    window.requestAnimationFrame(draw);
}

/**
 * Clears the spline and redraws the canvas.
 */
function clear() {
    spline = new Spline();
    window.requestAnimationFrame(draw);
}


/**
 * Draws the canvas.
 */
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
 * Draws a circle centered at (`i`, `j`) with radius `radius`.
 * @param {Number} i The i-coordinate of the center.
 * @param {Number} j The j-coordinate of the center.
 * @param {Number} radius The radius.
 */
function drawCircle(i: number, j: number, radius: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(i, j, radius, 0, 2*Math.PI);
    ctx.fill();
}

/**
 * Wrapper around fillRect(j, i, 1, 1)
 * @param {Number} i 
 * @param {Number} j 
 * @param {String} color A valid CSS color. 
 */
function putPixel(i: number, j: number, color: string) {
    i = Math.floor(i);
    j = Math.floor(j);

    ctx.fillStyle = color;
    ctx.fillRect(i, j, 2, 2);
}

/**
 * Draws a cubic spline given by `params`.
 * @param {`Spline`} solution 
 */
function drawLine(solution: Solution) {

    for (let n = 0; n < solution.curves.length; n++) {
        
        let color: string = splineColor;
        if (!highlightedPoint && n == selectedCurveIndex) {
            color = selectedSplineColor;
        }

        const curve: Curve = solution.curves[n];

        let dt: number = 0;
        for (let t = 0; t < 1; t += dt) {

            // evaluate i, j <= P(t), where P is the current cubic spline section
            const i: number = 
                curve.a0[0] + curve.a1[0] * t 
                + curve.a2[0] * t*t + curve.a3[0] * t*t*t;
            const j: number = 
                curve.a0[1] + curve.a1[1] * t 
                + curve.a2[1] * t*t + curve.a3[1] * t*t*t;

            // evaluate (di, dj) <= P'(t), where P' is the derivative of P
            const di: number =
                curve.a1[0] + 2*curve.a2[0] * t
                + 3*curve.a3[0] * t*t;
            const dj: number =
                curve.a1[1] + 2*curve.a2[1] * t
                + 3*curve.a3[1] * t*t;
            
            // use adaptive sampling step size.
            // assuming the function f(t) = (x(t), y(t)) is locally linear,
            // i.e., x(t + dt) = x(t) + dt*x'(t), and y(t + dt) = y(t) + dt*y'(t),
            // then the t value for the 'next' point to graph will be about
            // t1 = min(1 / |x'(t)|, 1 / |y'(t)|) + t0
            dt = Math.min(1 / Math.abs(di), 1 / Math.abs(dj));
            putPixel(i, j, color);
        
        }
    }
}
