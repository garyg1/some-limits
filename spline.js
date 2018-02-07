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
        if (!other instanceof Point) {
            throw TypeError("Tried to compare a Point to something else!");
        }
        return (this.i === other.i) && (this.j === other.j);
    }
}

/**
 * Stores a spline 
 */
class Spline {
    constructor() {
        this.points = [];
        this.numberOfPoints = 0;
    }

    addPoint(i, j) {
        this.points.push(new Point(i, j));
        this.numberOfPoints++;
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
     * Generates a 1-D spline from this.points for a given coordinate (ex: 'i')
     * @param {string} index The coordinate to generate the 1-D spline for (ex: 'j')
     * @returns {Array} Solution A n-1 tuple of [const coeff, linear coeff, quad coeff, cubic coeff] for each interval in spline.
     */
    solveCurve(index) {
        var pts = this.points;
        let n = pts.length - 1; // there are n+1 points
        var a = 1;
        var b = 4;
        var c = 1;
        var D = [];

        // construct the matrix
        for (let i = 1; i < n ; i++) {
            D.push( 3*(pts[i+1][index] - pts[i+1][index]) 
                - 3*(pts[i][index] - pts[i-1][index]) );
        }

        // solve
        var C_ = [c / b];
        var D_ = [D[0] / b];
        for (let i = 1; i < n - 1; i++) {
            C_.push(c / (b - a * C_[i-1]) );
            D_.push((D[i] - a * D_[i-1]) / (b - a*C_[i-1]));
        }


        // construct solutions 
        var X_ = new Array(n-1);
        X_[n-2] = D_[n-2];
        for (let i = n-3; i >= 0; i--) {
            X_[i] = D_[i] + C_[i]*X_[i+1];
        }

        // construct quadratic term C
        var C = [0];
        for (let i = 0; i < n-1; i++) {
            C.push(X_[i]);
        }
        C.push(0); // c_n+1 = 0

        // construct a, b, d from quadratic term c
        var A = [];
        var B = [];
        var D = [];
        
        for (let i = 0; i < n+1; i++) {
            A.push(pts[i][index]);
        }
        
        for (let i = 0; i < n; i++) {
            D.push((C[i+1] + C[i]) / 3);
        }

        for (let i = 0; i < n; i++) {
            let b_i = (A[i+1] - A[i]) - C[i] - D[i];
            B.push(b_i);
        }

        // package solution
        var solution = [];
        for (let i = 0; i < n; i++) {
            solution.push([A[i], B[i], C[i], D[i]]);
        }

        return solution;
    }

    get curve() {
        var solution = [];

        ['i', 'j'].forEach((index) => {
            solution.push(this.solveCurve(index));
        });

        return solution;
    }
}