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
        this.VELOCITY = 0.01;
        this.useConstVelocity = true;
        this.points = [];
        this.spline = { curves: [] };
    }
    Spline.prototype.setUseConstVelocity = function (newVal) {
        this.useConstVelocity = newVal;
    };
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
        if (this.points.length == 0) {
            this.addPoint(i, j);
            return;
        }
        var minCurve = this.getNearestCurve(i, j);
        var minCurveIndex = minCurve.index;
        var minCurveDist = minCurve.dist;
        if (minCurveIndex == -1 || minCurveIndex == -3) {
            this.addPoint(i, j);
        }
        else if (minCurveIndex == -2) {
            this.points.splice(0, 0, new Point(i, j));
        }
        else {
            this.points.splice(minCurveIndex + 1, 0, new Point(i, j));
        }
        this.setcurve();
    };
    Spline.prototype.getNearestCurve = function (x, y) {
        var TOLERANCE = 0.05;
        var MAX_DIST = 200;
        var minDistSq = Number.MAX_VALUE;
        var minCurveIndex = -1;
        this.spline.curves.forEach(function (curve, index) {
            var k0, k1, k2, k3;
            var k4, k5, k6;
            k0 = k1 = k2 = k3 = k4 = k5 = k6 = 0;
            var a0 = [curve.a0[0] - x, curve.a0[1] - y];
            for (var d = 0; d < 2; d++) {
                k6 += Math.pow(curve.a3[d], 2);
                k5 += 2 * curve.a2[d] * curve.a3[d];
                k4 += Math.pow(curve.a2[d], 2) + 2 * curve.a1[d] * curve.a3[d];
                k3 += 2 * curve.a1[d] * curve.a2[d] + 2 * a0[d] * curve.a3[d];
                k2 += 2 * a0[d] * curve.a2[d] + Math.pow(curve.a1[d], 2);
                k1 += 2 * a0[d] * curve.a1[d];
                k0 += Math.pow(a0[d], 2);
            }
            var pointsToCheck = [0, 1];
            if (k3 == k4 && k4 == k5 && k5 == k6 && k6 == 0) {
                var t = -0.5 * k1 / k2;
                if (t <= 1 && t >= 0) {
                    pointsToCheck.push(t);
                }
            }
            else {
                var computedRoots = findRoots([k1, k2 * 2, k3 * 3, k4 * 4, k5 * 5, k6 * 6]);
                for (var i = 0; i < computedRoots[0].length; i++) {
                    if (Math.abs(computedRoots[1][i]) < TOLERANCE
                        && computedRoots[0][i] >= 0 && computedRoots[0][i] <= curve.t[0]) {
                        pointsToCheck.push(computedRoots[0][i]);
                    }
                }
            }
            var localMin = Number.MAX_VALUE;
            for (var i = 0; i < pointsToCheck.length; i++) {
                var t = pointsToCheck[i];
                var distSq = k6 * Math.pow(t, 6) + k5 * Math.pow(t, 5)
                    + k4 * Math.pow(t, 4) + k3 * Math.pow(t, 3) + k2 * Math.pow(t, 2)
                    + k1 * t + k0;
                if (distSq < localMin) {
                    localMin = distSq;
                }
            }
            if (localMin < minDistSq) {
                minDistSq = localMin;
                minCurveIndex = index;
            }
        });
        if (minCurveIndex == 0) {
            if (this.points[0].dist(new Point(x, y)) <= 1 + Math.pow(minDistSq, 0.5)) {
                minCurveIndex = -2;
            }
        }
        else if (minCurveIndex == this.points.length - 2) {
            if (this.points[this.points.length - 1].dist(new Point(x, y)) <= 1 + Math.pow(minDistSq, 0.5)) {
                minCurveIndex = -3;
            }
        }
        if (minDistSq < Math.pow(MAX_DIST, 2)) {
            return { index: minCurveIndex, dist: Math.pow(minDistSq, 0.5) };
        }
        else {
            return { index: -1, dist: Number.MAX_VALUE };
        }
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
        var solution = { curves: [] };
        for (var i = 0; i < n; i++) {
            solution.curves.push({ t: 1, a0: a[i], a1: b[i], a2: c[i], a3: d[i] });
        }
        return solution;
    };
    Spline.prototype.solveCurveConstVelocity = function (index) {
        var pts = this.points;
        var n = pts.length - 1;
        var a = new Array(n + 1);
        for (var i = 0; i < n + 1; i++) {
            a[i] = pts[i][index];
        }
        var b = new Array(n);
        var d = new Array(n);
        var h = new Array(n);
        for (var i = 0; i < n; i++) {
            h[i] = pts[i].dist(pts[i + 1]) * this.VELOCITY;
        }
        var r = new Array(n);
        for (var i = 0; i < n; i++) {
            if (i == 0)
                r[i] = 3 * (a[1] - a[0]) / h[i];
            else
                r[i] = 3 * (a[i + 1] - a[i]) / h[i] - 3 * (a[i] - a[i - 1]) / h[i - 1];
        }
        var cp = new Array(n + 1);
        var dp = new Array(n + 1);
        cp[0] = 0;
        dp[0] = 0;
        for (var i = 1; i < n; i++) {
            var denom = 2 * (h[i] + h[i - 1]) - h[i] * cp[i - 1];
            cp[i] = h[i] / denom;
            dp[i] = (r[i] - h[i - 1] * dp[i - 1]) / denom;
        }
        var c = new Array(n + 1);
        c[n] = 0;
        for (var j = n - 1; j >= 0; j--) {
            c[j] = dp[j] - cp[j] * c[j + 1];
            b[j] = (a[j + 1] - a[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
            d[j] = (c[j + 1] - c[j]) / 3 / h[j];
        }
        var solution = { curves: [] };
        for (var i = 0; i < n; i++) {
            solution.curves.push({ t: h[i], a0: a[i], a1: b[i], a2: c[i], a3: d[i] });
        }
        return solution;
    };
    Spline.prototype.setcurve = function () {
        var _this = this;
        if (this.points.length == 0)
            return;
        var numCurves = this.points.length - 1;
        var solutions = [];
        ['i', 'j'].forEach(function (index) {
            if (_this.useConstVelocity)
                solutions.push(_this.solveCurveConstVelocity(index));
            else
                solutions.push(_this.solveCurve(index));
        });
        var solution = { curves: [] };
        var _loop_1 = function (i) {
            var curve = { t: [], a0: [], a1: [], a2: [], a3: [] };
            var _loop_2 = function (j) {
                ['a0', 'a1', 'a2', 'a3'].forEach(function (param, index) {
                    curve[param].push(solutions[j].curves[i][param]);
                });
            };
            for (var j = 0; j < solutions.length; j++) {
                _loop_2(j);
            }
            curve.t.push(solutions[0].curves[i].t);
            solution.curves.push(curve);
        };
        for (var i = 0; i < numCurves; i++) {
            _loop_1(i);
        }
        this.spline = solution;
    };
    Spline.prototype.curve = function () {
        return this.spline;
    };
    return Spline;
}());
