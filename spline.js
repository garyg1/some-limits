class Point {
    constructor(i, j) {
        this.i = i;
        this.j = j;
    }

    /**
     * Returns whether this point and another point have the same coordinates.
     * @param {Point} other
     */
    equals(other) {
        if (!other) return false;
        if (!other instanceof Point) {
            throw TypeError("Tried to compare a Point to something else!");
        }
        return (this.i === other.i) && (this.j === other.j);
    }


    dist(other) {
        if (!other instanceof Point) {
            throw TypeError("Tried to calculate distance between point and something else!");
        }
        let norm = Math.pow(this.i - other.i, 2) + Math.pow(this.j - other.j, 2);
        return Math.pow(norm, 0.5);
    }
}

/**
 * Stores a spline 
 */
class Spline {
    constructor() {
        this.points = [];
    }

    addPoint(i, j) {
        i = Math.floor(i);
        j = Math.floor(j);

        this.points.push(new Point(i, j));
    }

    /**
     * Removes the first instance of Point(i, j) in this spline.
     * @param {Number} i 
     * @param {Number} j 
     */
    removePoint(i, j) {
        let target = new Point(i, j);
        
        this.points.some((point, index, array) => {
            if (target.equals(point)) {
                array.splice(index, 1);
                return true;
            }
        });
    }

    /**
     * Removes the first instance of target in this spline.
     * @param {Point} target
     */
    removePoint(target) {
        this.points.some((point, index, array) => {
            if (target.equals(point)) {
                array.splice(index, 1);
                return true;
            }
        });
    }

    removeLastPoint() {
        this.points.splice(this.points.length - 1, 1);
    }

    getNearestPoint(i, j, dist) {
        var ans;
        var minDist = 1000000;
        var target = new Point(i, j);
        this.points.forEach((point) => {
            let currDist = target.dist(point);
            if (currDist <= dist && currDist < minDist) {
                ans = point;
                minDist = currDist;
            } 
        });

        return ans;
    }

    /**
     * Generates a 1-D spline from this.points for a given coordinate (ex: 'i')
     * @param {string} index The coordinate to generate the 1-D spline for (ex: 'j')
     * @returns {Array} Solution A n-1 tuple of [const coeff, linear coeff, quad coeff, cubic coeff] for each interval in spline.
     */
    solveCurve(index) {
        var pts = this.points;
        let n = pts.length - 1; // there are n+1 points
        
        var a = new Array(n+1);
        for (let i = 0; i < n+1; i++) {
            a[i] = pts[i][index];
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
        var solution = [];
        for (let i = 0; i < n; i++) {
            solution.push([a[i], b[i], c[i], d[i]]);
        }

        return solution;
    }

    /**
     * Returns the parameters for this spline in the form
     * {
     *   A: a list of n 2-tuples,
     *   B: a list of n 2-tuples,
     *   C: a list of n 2-tuples,
     *   D: a list of n 2-tuples
     * }
     */
    get curve() {
        if (this.points.length == 0) return;
        // let t1 = Date.now();
        var curves = [];

        
        ['i', 'j'].forEach((index) => {
            curves.push(this.solveCurve(index));
        });
        

        var solution = { A: [], B: [], C: [], D: [] };

        let indices = ['A', 'B', 'C', 'D'];

        for (let i = 0; i < curves[0].length; i++) {
            for (let j = 0; j < 4; j++) {
                var coords = [];
                coords.push(curves[0][i][j]);
                coords.push(curves[1][i][j]);


                solution[indices[j]].push(coords);
            }
        }

        // console.log(Date.now() - t1);

        return solution;
    }
}