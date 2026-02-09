The quadratic formula is one of the few pieces of algebra that almost everyone remembers long after school. It gives the solutions to any equation of the form \( ax^2 + bx + c = 0 \), where \( a \neq 0 \). You can write the roots in a single, compact expression:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

The symbol \( \pm \) means we get two roots: one using the plus sign and one using the minus. So the formula is really two formulas in one. No matter what real (or complex) numbers you plug in for \( a \), \( b \), and \( c \), this expression always gives the correct roots—provided we interpret square roots and arithmetic in the complex numbers when necessary.

**Why it works**

The formula comes from completing the square. We start with \( ax^2 + bx + c = 0 \), divide by \( a \), and move the constant term to the right:

\[
x^2 + \frac{b}{a}x = -\frac{c}{a}.
\]

We then add \( \bigl(\frac{b}{2a}\bigr)^2 \) to both sides so that the left-hand side becomes a perfect square:

\[
\Bigl(x + \frac{b}{2a}\Bigr)^2 = \frac{b^2 - 4ac}{4a^2}.
\]

Taking square roots and solving for \( x \) yields the quadratic formula. So the formula is not a trick; it is the result of a standard algebraic procedure applied to the general quadratic.

**The discriminant**

The quantity under the square root, \( b^2 - 4ac \), is called the *discriminant*, often denoted \( \Delta \). It determines how many real roots the equation has and whether they are distinct or repeated:

| Discriminant | Roots |
| ------------ | ----- |
| \(\Delta > 0\) | Two distinct real roots |
| \(\Delta = 0\) | One repeated real root |
| \(\Delta < 0\) | Two complex conjugate roots |

So the number of real solutions depends only on \(\Delta\). When \( \Delta = 0 \), the \( \pm \) in the formula does not produce two different numbers; both signs give the same value \( x = -b/(2a) \), so we say there is one “repeated” or “double” root. When \( \Delta < 0 \), the square root is a non-real complex number, and the two roots are complex conjugates. In many applications we care only about real solutions, so checking the sign of \( \Delta \) tells us immediately whether we have two, one, or no real roots.

**Using the formula**

Suppose we want to solve \( x^2 - 5x + 6 = 0 \). Here \( a = 1 \), \( b = -5 \), and \( c = 6 \). The discriminant is \( \Delta = 25 - 24 = 1 > 0 \), so we expect two distinct real roots. Plugging into the formula:

\[
x = \frac{5 \pm \sqrt{1}}{2} = \frac{5 \pm 1}{2},
\]

so \( x = 3 \) or \( x = 2 \). We can check: \( (x-3)(x-2) = x^2 - 5x + 6 \), so the factorization confirms the roots.

For an example with a repeated root, take \( x^2 - 4x + 4 = 0 \). Then \( \Delta = 16 - 16 = 0 \), and the formula gives \( x = (4 \pm 0)/2 = 2 \). So the only root is \( 2 \), and the left-hand side factors as \( (x-2)^2 \).

**Where quadratics show up**

Quadratic equations appear in many areas. In physics, the height of a ball thrown under gravity is a quadratic function of time; setting it to zero and solving gives the times when the ball is at ground level. In optimization, we often minimize or maximize a quadratic function; the critical point is where the derivative (a linear function) is zero, which leads to a linear equation, but the second derivative and the shape of the parabola are tied to the sign of the leading coefficient and the discriminant. In statistics, least-squares problems with one unknown often reduce to a quadratic in that unknown.

**A note on computation**

When we implement the quadratic formula on a computer, the expression \( (-b + \sqrt{\Delta})/(2a) \) or \( (-b - \sqrt{\Delta})/(2a) \) can suffer from cancellation if \( b^2 \gg 4ac \): then \( -b \) and \( \sqrt{b^2 - 4ac} \) are close in magnitude, and subtracting them loses precision. A more stable approach is to compute one root from the formula and the other from the fact that the product of the roots equals \( c/a \), so the second root is \( c/(a \cdot x_1) \). This way we avoid subtracting two nearly equal numbers when possible.

**Relation to Vieta’s formulas**

The roots \( x_1 \) and \( x_2 \) of \( ax^2 + bx + c = 0 \) satisfy Vieta’s formulas: \( x_1 + x_2 = -b/a \) and \( x_1 x_2 = c/a \). So the sum of the roots is minus the linear coefficient divided by the leading coefficient, and the product is the constant term divided by the leading coefficient. Once you know one root from the quadratic formula, you can get the other from these relations without taking another square root. That is exactly what we use in the stable numerical method mentioned above: compute one root from the formula, then the other as \( c/(a \cdot x_1) \).

**Summary**

The quadratic formula gives a closed form for the roots of \( ax^2 + bx + c = 0 \). The discriminant \( \Delta = b^2 - 4ac \) tells us how many real roots there are and whether they coincide. The formula comes from completing the square, and with a little care it can be used reliably both on paper and in numerical code. Whether you are solving a problem by hand or writing a solver, understanding the discriminant and the derivation makes it easier to interpret and check your results, and to see why the formula works the way it does.
