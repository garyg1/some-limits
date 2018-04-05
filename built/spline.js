var Point = (function () {
    function Point(i, j) {
        this.i = i;
        this.j = j;
    }
    Point.prototype.equals = function (other) {
        if (!other)
            return false;
        return (this.i === other.i) && (this.j === other.j);
    };
    Point.prototype.dist = function (other) {
        var norm = Math.pow(this.i - other.i, 2) + Math.pow(this.j - other.j, 2);
        return Math.pow(norm, 0.5);
    };
    return Point;
}());
var Spline = (function () {
    function Spline() {
        this.points = [];
    }
    Spline.prototype.addPoint = function (i, j) {
        i = Math.floor(i);
        j = Math.floor(j);
        this.points.push(new Point(i, j));
        this.setcurve();
    };
    Spline.prototype.removePointByCoords = function (i, j) {
        var target = new Point(i, j);
        this.points.some(function (point, index, array) {
            if (target.equals(point)) {
                array.splice(index, 1);
                return true;
            }
        });
        this.setcurve();
    };
    Spline.prototype.removePoint = function (target) {
        this.points.some(function (point, index, array) {
            if (target.equals(point)) {
                array.splice(index, 1);
                return true;
            }
        });
        this.setcurve();
    };
    Spline.prototype.removeLastPoint = function () {
        this.points.splice(this.points.length - 1, 1);
        this.setcurve();
    };
    Spline.prototype.getNearestPoint = function (i, j, dist) {
        var index = this.getNearestPointByIndex(i, j, dist);
        if (index == -1)
            return undefined;
        return this.points[index];
    };
    Spline.prototype.getNearestPointByIndex = function (i, j, dist) {
        var minIndex = -1;
        var minDist = 1000000;
        var target = new Point(i, j);
        this.points.forEach(function (point, index) {
            var currDist = target.dist(point);
            if (currDist <= dist && currDist < minDist) {
                minIndex = index;
                minDist = currDist;
            }
        });
        return minIndex;
    };
    Spline.prototype.insertPoint = function (i, j) {
        var closestPointIndex = this.getNearestPointByIndex(i, j, Infinity);
        var newPoint = new Point(i, j);
        if (closestPointIndex == -1) {
            this.addPoint(i, j);
            return;
        }
        var closestPoint = this.points[closestPointIndex];
        if (this.points.length === closestPointIndex + 1 && closestPointIndex >= 1) {
            var nextToLastPoint = this.points[closestPointIndex - 1];
            if (nextToLastPoint.dist(newPoint) < nextToLastPoint.dist(closestPoint)) {
                this.points.splice(closestPointIndex, 0, newPoint);
            }
            else {
                this.addPoint(i, j);
                return;
            }
        }
        else if (this.points.length == closestPointIndex + 1) {
            this.addPoint(i, j);
            return;
        }
        else if (closestPointIndex === 0 && this.points.length > 1) {
            var secondPoint = this.points[1];
            if (secondPoint.dist(newPoint) < secondPoint.dist(closestPoint)) {
                this.points.splice(1, 0, newPoint);
            }
            else {
                this.points.splice(0, 0, newPoint);
            }
        }
        else {
            var pointBefore = this.points[closestPointIndex - 1];
            var pointAfter = this.points[closestPointIndex + 1];
            if (pointAfter.dist(newPoint) < pointBefore.dist(newPoint)) {
                this.points.splice(closestPointIndex + 1, 0, newPoint);
            }
            else {
                this.points.splice(closestPointIndex, 0, newPoint);
            }
        }
        this.setcurve();
    };
    Spline.prototype.solveCurve = function (index) {
        var pts = this.points;
        var n = pts.length - 1;
        var a = new Array(n + 1);
        for (var i = 0; i < n + 1; i++) {
            a[i] = pts[i][index];
        }
        var b = new Array(n);
        var d = new Array(n);
        var h = 1;
        var r = new Array(n);
        for (var i = 0; i < n; i++) {
            if (i == 0)
                r[i] = 3 * (a[1] - a[0]);
            else
                r[i] = 3 * (a[i + 1] - a[i]) - 3 * (a[i] - a[i - 1]);
        }
        var c = new Array(n + 1);
        var l = new Array(n + 1);
        var m = new Array(n + 1);
        var z = new Array(n + 1);
        l[0] = 1;
        m[0] = 0;
        z[0] = 0;
        for (var i = 1; i < n; i++) {
            l[i] = 2 * 2 - h * m[i - 1];
            m[i] = h / l[i];
            z[i] = (r[i] - h * z[i - 1]) / l[i];
        }
        l[n] = 1;
        z[n] = 0;
        c[n] = 0;
        for (var j = n - 1; j >= 0; j--) {
            c[j] = z[j] - m[j] * c[j + 1];
            b[j] = (a[j + 1] - a[j]) / h - h * (c[j + 1] + 2 * c[j]) / 3;
            d[j] = (c[j + 1] - c[j]) / 3 / h;
        }
        var solution = [];
        for (var i = 0; i < n; i++) {
            solution.push([a[i], b[i], c[i], d[i]]);
        }
        return solution;
    };
    Spline.prototype.setcurve = function () {
        var _this = this;
        if (this.points.length == 0)
            return;
        var curves = [];
        ['i', 'j'].forEach(function (index) {
            curves.push(_this.solveCurve(index));
        });
        var solution = { A: [], B: [], C: [], D: [] };
        var indices = ['A', 'B', 'C', 'D'];
        for (var i = 0; i < curves[0].length; i++) {
            for (var j = 0; j < 4; j++) {
                var coords = [];
                coords.push(curves[0][i][j]);
                coords.push(curves[1][i][j]);
                solution[indices[j]].push(coords);
            }
        }
        this.spline = solution;
    };
    Spline.prototype.curve = function () {
        return this.spline;
    };
    return Spline;
}());
