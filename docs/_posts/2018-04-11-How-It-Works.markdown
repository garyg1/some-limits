---
layout: post
title: "Building a Spline Editor with HTML5 and  TypeScript"
date: 2018-04-11 21:50:54 -0400
---

You can check it out [here](http://garygurlaskie.com/some-limits).

### The Math

#### Splines
Informally, a cubic spline is a "smooth" piecewise polynomial that interpolates a sequence of control points. The piecewise segments are defined between adjacent control points. At the control points, the piecewise segments are "smooth" in the sense that they have the same first and second derivatives.

Formally, given points \\( (t_1, x_1), (t_2, x_2), ..., (t_n, x_n) \\), a __cubic spline__  is a piecewise cubic polynomial \\( f(t) \\) that passes through each \\( (t_i, x_i) \\) pair, and has the property that \\( f \\), \\( f' \\), and \\( f^{\prime\prime} \\) are continuous on \\( [t_1, t_n] \\).

#### Uniquely Defining Splines
For any set of points, there are many different cubic splines that interpolate them. 

A cubic spline will have \\( 4(n - 1) = 4n - 4 \\) unknowns -- four coefficients for each of \\( n - 1 \\) cubic polynomials. We have fewer constraints:

1. \\( f_i(t_i) = x_i \\),
2. \\( f_i(t_{i+1}) = x_{i+1} \\),
3. \\( f_i'(t_{i + 1}) = f_{i+1}'(t_{i+1}) \\), and
4. \\( f_i^{\prime\prime}(t_{i+1}) = f_{i+1}^{\prime\prime}(t_{i+1}) \\)

There are only \\( (n-1) + (n-1) + (n-2) + (n-2) = 4n - 6 \\) constraints, so if we solve the system to find a cubic spline for a set of points, there will be two free variables.

We will impose two more constraints, so that we can uniquely define a cubic spline from the control points.

#### Natural Splines

A __natural cubic spline__ is a cubic spline that also satisfies the condition that \\( f^{\prime\prime}(t_1) = f^{\prime\prime}(t_n) = 0 \\).

Natural cubic splines inherit the constraints of cubic splines, but have the two additional constraints on the second derivative. To find a natural spline, we must solve a linear system with \\( 4n - 4 \\) unknowns (the polynomial coefficients) and \\( 4n - 4 \\) constraints, which  means that natural splines are uniquely defined.

#### Benefits

Splines are stable -- small changes to the control points will only result in small changes to the spline. For comparison, [interpolating polynomials](https://en.wikipedia.org/wiki/Lagrange_polynomial) are very unstable.

#### In Multiple Dimensions

We will show that a natural spline in multiple dimensions can be calculated by finding the natural spline in each dimension.

Suppose we want to interpolate the points \\( r_1 = (x_1, y_1, z_1), r_2 = (x_2, y_2, z_2), ..., r_n = (x_n, y_n, z_n) \\) with a natural cubic spline. The easiest way is to define the spline \\( f \\) paramterically, with \\( f(t) = (x(t), y(t), z(t)) \\). 

We choose \\( t_1, t_2, ..., t_n \\) to be evenly spaced. Then, we let 

\\( x(t) \\) be the natural cubic spline for \\( (t_1, x_1), (t_2, x_2), ..., (t_n, x_n) \\), 

\\( y(t) \\) be the natural spline for \\( (t_1, y_1), ..., (t_n, y_n) \\), and 

\\( z(t) \\) be the natural spline for \\( (t_1, z_1), ... , (t_n, z_n) \\). 

Since \\( x(t) \\), \\( y(t) \\), and \\( z(t) \\) have continuous first and second derivatives at \\( t_1, t_2, ... , t_n \\), then \\( f(t) \\) will as well. Also, since \\( x \\), \\( y \\), and \\( z \\) all satisfy the natural cubic spline property, then so will \\( f \\). Hence, \\( f \\) is a natural cubic spline that interpolates \\( r_1, r_2, ..., r_n \\)

### My Implementation
TODO
1. Spline Solver
* Calculates spline in each individual dimension, then combines them

2. Nearest Spline
* Attempting to minimize the distance results in a 5th order polynomial
* There is no explicit formula for the roots
* Use the Durand-Kerner method to calculate all five roots simultaneously.
* Then find minimum from real-valued roots 

3. Curve Drawing
* Naive method: t = 0, t < 1, t += 0.001 is slow on mobile
* How to find first t-value that gives a different point?
* Derive dt = min(1 / x'(t), 1 / y'(t))
* Accurate enough and fast enough to do live updates.
* Wolfram's "Adaptive" curve drawing?


