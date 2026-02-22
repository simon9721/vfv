import numpy as np
import matplotlib.pyplot as plt

# Vector field: F(x,y) = (y, x*y)
def field(x, y):
    u = y
    v = x * y
    return u, v

# Grid
x = np.linspace(-3, 3, 25)
y = np.linspace(-3, 3, 25)
X, Y = np.meshgrid(x, y)
U, V = field(X, Y)

# For streamlines (needs a denser grid)
xs = np.linspace(-3, 3, 200)
ys = np.linspace(-3, 3, 200)
XS, YS = np.meshgrid(xs, ys)
US, VS = field(XS, YS)

plt.figure(figsize=(7, 7))

# Streamplot shows flow lines; color by speed
speed = np.hypot(US, VS)
plt.streamplot(XS, YS, US, VS, density=1.2, linewidth=1, arrowsize=1.2, color=speed)

# Quiver shows arrow directions at sample points
plt.quiver(X, Y, U, V, angles="xy", scale_units="xy", scale=20, width=0.003)

# Reference axes
plt.axhline(0, linewidth=1)
plt.axvline(0, linewidth=1)

plt.title(r"Vector field $\mathbf{F}(x,y) = (y,\,xy)$")
plt.xlabel("x")
plt.ylabel("y")
plt.xlim(-3, 3)
plt.ylim(-3, 3)
plt.gca().set_aspect("equal", adjustable="box")
plt.tight_layout()
plt.show()