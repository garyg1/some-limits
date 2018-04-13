---
title: "Building a fast spline editor with HTML5"
---

This is a write-up for a HTML5 Canvas spline-drawing program.

You can check it out [here](http://garygurlaskie.com/some-limits/), and you can find the source code [here](https://github.com/garyg1/some-limits/tree/master/src).

## Cubic splines

### Definition

Given points \\( (t_0, x_0), (t_1, x_1), ..., (t_n, x_n) \\), a __cubic spline__  is a piecewise cubic polynomial \\( f(t) \\) that passes through each \\( (t_i, x_i) \\) pair, and has the property that \\( f \\), \\( f' \\), and \\( f^{\prime\prime} \\) are continuous on \\( [t_0, t_n] \\).

### Uniqueness
For any set of points, there are many different cubic splines that interpolate them.

Cubic splines have \\( 4n \\) coefficients, but there are only \\( 4n - 2 \\) constraints on their coefficients. We will impose two more constraints, and then we can uniquely define a "natural" cubic spline from the control points.

### Natural Splines

A __natural cubic spline__ is a cubic spline that also satisfies the condition that \\( f^{\prime\prime}(t_0) = f^{\prime\prime}(t_n) = 0 \\).

## Implementation

### Parametric Splines

**The problem:** Given a set of points \\( r_0 = (x_0, y_0), r_1 = (x_1, y_1), ... , r_n = (x_n, y_n) \\), we want to construct a spline that interpolates them *in order*. 

We can't do this with splines in a single dimension. So we parameterize, and consider a parametric function \\( f(t) = (x(t), y(t)) \\) that interpolates \\( (0, r_0), (1, r_1), ... , (n, r_n) \\). You can show that if \\( x(t) \\) and \\( y(t) \\) are splines for \\( \\{(i, x_i)\\} \\) and \\( \\{(i, y_i)\\} \\), then \\( f(t) \\) will be a spline for \\( \\{(i, r_i)\\} \\).

### Finding the closest spline segment to a point

**The problem:** Given a point \\( (x, y) \\) and a parametric cubic spline \\( f(t) = (x(t), y(t))\\), find the segment of the spline \\( (x, y) \\) is closest to.

Since splines are continuous, we can just apply basic optimization techniques:

1. For each spline segment \\( f_i \\), find the critical points of the distance \\( D_i(t) \\). 
2. The critical point \\(s\\) with the smallest \\( D_i(s) \\) is the absolute minimum for this spline.
3. Choose the spline segment with the smallest minimum distance.

But we run into a problem: the squared distance from a cubic function to a point is a sixth degree polynomial, so the derivative is a fifth degree polynomial. There is no explicit formula! 

We must choose an iterative method to find the roots. An simple and interesting one is called Durand-Kerner, which finds all five roots simultaneously. Some of the roots will be complex numbers.

#### The Durand-Kerner method

The method comes from the observation that

$$ P(x) = (x - r_1)(x - r_2)(x - r_3)(x - r_4)(x - r_5) $$

implies

$$ r_1 = x + \frac {P(x)} {(x - r_2)(x - r_3)(x - r_4)(x - r_5)}$$

Then, we perform a fixed point iteration to solve for all five roots simultaneously. We choose initial values \\( a_0, b_0,..., e_0 \in C \\). Then we compute

$$ a_{i + 1} = a_i + \frac {P(a_i)} {(a_i - b_i)(a_i - c_i)(a_i - d_i)(a_i - e_i)}$$

$$ b_{i + 1} = b_i + \frac {P(b_i)} {(b_i - a_i)(b_i - c_i)(b_i - d_i)(b_i - e_i)}$$

$$ ... $$

$$ e_{i + 1} = e_i + \frac {P(e_i)} {(e_i - a_i)(e_i - b_i)(e_i - c_i)(e_i - d_i)}$$

until \\( \|a_{i+1} - a_i\| < \\epsilon \\), \\( \|b_{i+1} - b_i\| < \\epsilon \\), \\(...\\), and \\( \|e_{i+1} - e_i\| < \\epsilon \\) for some tolerance \\( \epsilon \\). 

The [Wikipedia article](https://en.wikipedia.org/wiki/Durand%E2%80%93Kerner_method) is a pretty good read.

#### Other methods

I read an [interesting paper](http://homepage.divms.uiowa.edu/~atkinson/ftp/CurvesAndSufacesClosestPoint.pdf) about using an ensemble method to solve this problem. The authors were using cubic splines to model roads for a driving simulator, and wanted to know where the vehicle was on the road given the \\((x, y, z) \\) coordinates.

### Drawing the curve

**The problem:** Graph a cubic spline continuously on a grid of pixels.

In other words, we want to find \\( 0 = t_1 < t_2 < ... < t_{k-1} < t_k = 1\\) such that, if we plot the points \\( f(t_1), f(t_2), ..., f(t_k) \\) as the 1x1 pixels they live inside, the squares will be connected.

We will use an adaptive algorithm to find the \\( t_i \\).

Let's impose an additional restriction -- if we have for all \\( 1 \\le t \\le k \\) that

$$ \max(|x(t_{i+1}) - x(t_i)|, |y(t_{i+1}) - y(t_i)|) = 1$$

then our set of squares will certainly be adjacent. 

Let's approximate 

$$ x(t_{i+1}) \approx x(t_i) + x'(t_i) (t_{i+1} - t_i)$$

so we have that 

$$ 1 \approx |x'(t_i) (t_{i+1} - t_i)|$$

and 

$$ t_{i+1} \approx t_1 + \frac {1}{|x'(t_i)|}$$

and by the same argument for \\( y(t) \\), we have

$$ t_{i+1} \approx t_1 + \min(\frac {1}{|x'(t_i)|}, \frac{1}{|y'(t_i)|})$$

If the first-derivative approximation for \\( x(t_{i+1}) \\) is close (which it usually is), the \\( t_i \\) generated will give us connected squares. Even better, the number of \\( t_i \\) generated will be close to the minimal number of \\( t_i \\) that still give us connected squares (since our \\( t_i \\) were chosen so that \\( \\max(\\Delta x, \\Delta y) \\) = 1)

Here is the code for the adaptive step-size.

    let dt: number = 0;
    for (let t = 0; t < 1; t += dt) {
        // evaulate x(t), y(t), x'(t), y'(t)...
        
        // update t using adaptive algorithm
        dt = Math.min(1 / Math.abs(dx), 1 / Math.abs(dy));

        // plot the point
        putPixel(x, y, color);
    }

## Conclusion

I had a lot of fun building this, and I got to learn about a simultaneous root-finding algorithm and I got to figure out a decent way to do adaptive polynomial graphing. If you have any comments or think I could have done it better, [I'd love to hear](mailto:garygurlaskie@gmail.com).
