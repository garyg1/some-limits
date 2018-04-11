class Point {
    i: number;
    j: number;
    [key: string]: any;

    constructor(i: number, j: number) {
        this.i = i;
        this.j = j;
    }

    /**
     * Returns whether this point and another point have the same coordinates.
     * @param {Point} other
     */
    equals(other: Point) {
        if (!other) return false;
        return (this.i === other.i) && (this.j === other.j);
    }


    /**
     * Gets the distance from this Point to another Point.
     * @param {Point} other 
     * @returns {Number} dist The distance (Euclidian) from `this` to `other`
     */
    dist(other: Point) {
        let norm = Math.pow(this.i - other.i, 2) + Math.pow(this.j - other.j, 2);
        return Math.pow(norm, 0.5);
    }
}

/**
 * Stores a spline 
 */
class Spline {

    spline: Solution;
    points: Array<Point>;

    /**
     * Initialized an empty spline.
     */
    constructor() {
        this.points = [];
        this.spline = <Solution> { curves: [] };
    }

    /**
     * Adds Point(i, j) to the end of this Spline.
     * @param {Number} i 
     * @param {Number} j 
     */
    addPoint(i: number, j: number) {
        i = Math.floor(i);
        j = Math.floor(j);

        this.points.push(new Point(i, j));

        this.setcurve()
    }

    /**
     * Removes the first instance of Point(i, j) in this spline.
     * @param {Number} i 
     * @param {Number} j 
     */
    removePointByCoords(i: number, j: number) {
        let target = new Point(i, j);
        
        this.points.some((point, index, array) => {
            if (target.equals(point)) {
                array.splice(index, 1);
                return true;
            }
        });

        this.setcurve()
    }

    /**
     * Removes the first instance of target in this spline.
     * @param {Point} target
     */
    removePoint(target: Point) {
        this.points.some((point, index, array) => {
            if (target.equals(point)) {
                array.splice(index, 1);
                return true;
            }
        });

        this.setcurve()
    }

    /**
     * Removes the last point in this spline.
     */
    removeLastPoint() {
        this.points.splice(this.points.length - 1, 1);
        this.setcurve()
    }

    /**
     * Returns the nearest point to (i, j) within dist.
     * If no point found, returns undefined.
     * @param {Number} i 
     * @param {Number} j 
     * @param {Number} dist 
     * 
     * @returns {Point} point The nearest point, or `undefined`.
     */
    getNearestPoint(i: number, j: number, dist: number): Point {
        var index = this.getNearestPointByIndex(i, j, dist);

        if (index == -1) return undefined;
        return this.points[index];
    }

    getNearestPointByIndex(i: number, j: number, dist: number): number {
        var minIndex: number = -1;
        var minDist = 1000000;
        var target = new Point(i, j);
        this.points.forEach((point, index) => {
            let currDist = target.dist(point);
            if (currDist <= dist && currDist < minDist) {
                minIndex = index;
                minDist = currDist;
            }
        });

        return minIndex;
    }

    /** First calculates the closest spline segment to (x, y), 
     * then adds a new Point at (x, y) between the segment's endpoints.  */
    insertPoint(i: number, j: number) {
        // don't do computations if there are no points
        if (this.points.length == 0) {
            this.addPoint(i, j);
            return;
        }

        const minCurve: MinCurve = this.getNearestCurve(i, j);
        
        const minCurveIndex: number = minCurve.index;
        const minCurveDist: number = minCurve.dist;

        // if no min curve found, add to the end
        if (minCurveIndex == -1) {
            this.addPoint(i, j);
        
        } else {
            this.points.splice(minCurveIndex + 1, 0, new Point(i, j));
            this.setcurve();
        }
    }

    /**
     * Returns a MinCurve {index, dist} of the spline piece closest
     * to the point (x, y).
     * @param x The first coordinate of point in question
     * @param y The second coordinate of point in question
     */
    getNearestCurve(x: number, y: number): MinCurve {

        const TOLERANCE = 0.05;
        const MAX_DIST = 100;

        // calculate minimum distance spline segment
        
        let minDistSq = Number.MAX_VALUE;
        let minCurveIndex = -1;

        // iterate through each spline segment, 
        // and calculate min distance from segment to Point(x, y)
        this.spline.curves.forEach((curve, index) => {
           
            // calculate constants in square distance formula
            let k0: number, k1: number, k2: number, k3: number;
            let k4: number, k5: number, k6: number;

            k0 = k1 = k2 = k3 = k4 = k5 = k6 = 0;

            let a0 = [curve.a0[0] - x, curve.a0[1] - y];

            // iterate through each dimension (i.e., curve.a0 = [a0x, a0y])
            for (let d = 0; d < 2; d++) {
                k6 += Math.pow(curve.a3[d], 2);
                k5 += 2*curve.a2[d]*curve.a3[d];
                k4 += Math.pow(curve.a2[d], 2) +  2*curve.a1[d]*curve.a3[d];
                k3 += 2*curve.a1[d]*curve.a2[d] + 2*a0[d]*curve.a3[d];
                k2 += 2*a0[d]*curve.a2[d] + Math.pow(curve.a1[d], 2);
                k1 += 2*a0[d]*curve.a1[d];
                k0 += Math.pow(a0[d], 2);
            }

            // 'differentiate' and find roots
            const computedRoots = findRoots([k1, k2*2, k3*3, k4*4, k5*5, k6*6]);
            const pointsToCheck = [0, 1];

            for (let i = 0; i < computedRoots[0].length; i++) {
                // if imaginary part is less than TOLERANCE
                if (Math.abs(computedRoots[1][i]) < TOLERANCE 
                    && computedRoots[0][i] >= 0 && computedRoots[0][i] <= 1) {
                    pointsToCheck.push(computedRoots[0][i]);
                }
            }

            let localMin: number = Number.MAX_VALUE;
            for (let i = 0; i < pointsToCheck.length; i++) {
                const t: number = pointsToCheck[i];
                const distSq: number = k6 * Math.pow(t, 6) + k5*Math.pow(t, 5)
                    + k4*Math.pow(t, 4) + k3*Math.pow(t, 3) + k2*Math.pow(t, 2)
                    + k1*t + k0;

                if (distSq < localMin) {
                    localMin = distSq;
                }
            }

            if (localMin < minDistSq) {
                minDistSq = localMin;
                minCurveIndex = index;
            }
        });

        if (minDistSq < Math.pow(MAX_DIST, 2)) {
            return {index: minCurveIndex, dist: Math.pow(minDistSq, 0.5)};
        } else {
            return {index: -1, dist: Number.MAX_VALUE};
        }
    }

    /**
     * Generates a 1-D spline from this.points for a given coordinate (ex: 'i')
     * @param {string} index The coordinate to generate the 1-D spline for (ex: 'j')
     * @returns {Array} Solution A n-1 tuple of [const coeff, linear coeff, quad coeff, cubic coeff] for each interval in spline.
     */
    solveCurve(index: string): Solution1D {
        var pts: Array<Point> = this.points;
        let n = pts.length - 1; // there are n+1 points
        
        var a = new Array(n+1);
        for (let i = 0; i < n+1; i++) {
            a[i] = <number>pts[i][index];
        }

        var b = new Array(n);
        
        var d = new Array(n);

        var h = 1;
        
        var r = new Array(n);
        for (let i = 0; i < n; i++) {
            if (i == 0)
                r[i] = 3*(a[1] - a[0]);
            else
                r[i] = 3*(a[i+1] - a[i]) - 3*(a[i] - a[i-1]);
        }

        var c = new Array(n+1);
        var l = new Array(n+1);
        var m = new Array(n+1);
        var z = new Array(n+1);

        l[0] = 1;
        m[0] = 0;
        z[0] = 0;

        for (let i = 1; i < n; i++) {
            l[i] = 2*2 - h*m[i-1];
            m[i] = h / l[i];
            z[i] = (r[i] - h*z[i-1])/l[i];
        }

        l[n] = 1;
        z[n] = 0;

        c[n] = 0;
        
        for (let j = n-1; j >= 0; j--) {
            c[j] = z[j] - m[j]*c[j+1];
            b[j] = (a[j+1] - a[j])/h - h*(c[j+1] + 2*c[j])/3;
            d[j] = (c[j+1] - c[j]) / 3 / h;
        }

        // package solution
        var solution = <Solution1D>{ curves: [] };
        for (let i = 0; i < n; i++) {
            solution.curves.push(<Curve1D>{ a0: a[i], a1: b[i], a2: c[i], a3: d[i] });
        }

        return solution;
    }

    /**
     * Generates the parameters for this spline (with n+1 points) in the form
     * ```
     * {
     *   A: a list of n 2-tuples,
     *   B: a list of n 2-tuples,
     *   C: a list of n 2-tuples,
     *   D: a list of n 2-tuples
     * }
     * ```
     * 
     * Then caches it as `this.spline`.
     */
    setcurve() {
        if (this.points.length == 0) return;
        const numCurves: number = this.points.length - 1;

        var solutions: Solution1D[] = [];
        ['i', 'j'].forEach((index) => {
            solutions.push(this.solveCurve(index));
        });

        // package two dimensions together into one solution
        let solution = <Solution>{ curves: [] };
        for (let i = 0; i < numCurves; i++) {
            let curve: Curve = <Curve>{a0: [], a1: [], a2: [], a3: []};

            for (let j = 0; j < solutions.length; j++) {
                ['a0', 'a1', 'a2', 'a3'].forEach((param, index) => {
                    curve[param].push(solutions[j].curves[i][param]);
                });
            }

            solution.curves.push(curve);
        }

        // cache solution
        this.spline = solution;
    }

    /**
     * Returns cached spline generated by `this.setcurve()`.
     */
    curve() {
        return this.spline;
    }
}

interface Curve1D {
    a0: number;
    a1: number;
    a2: number;
    a3: number;
    [key: string]: number;
}

interface Curve {
    a0: number[];
    a1: number[];
    a2: number[];
    a3: number[];
    [key: string]: number[];
}

interface Solution1D {
    curves: Curve1D[];
}

interface Solution {
    curves: Curve[];
}

interface MinCurve {
    index: number,
    dist: number,
}
