# Vector Field Visualizer

An interactive web-based tool for visualizing 2D and 3D vector fields with beautiful color plots and rotatable 3D views.

## Features

### Core Functionality
- ✅ **Expression Input**: Enter mathematical expressions like `i*x + j*y` or `i*sin(x) + j*cos(y)`
- ✅ **Beautiful Color Plots**: Color by magnitude, direction, or solid colors
- ✅ **Rotatable 3D**: Full 3D visualization with mouse controls (drag to rotate, scroll to zoom)

### Visualization Modes
- **Arrows**: Classic arrow representation showing direction and magnitude
- **Field Lines**: Streamlined view with lines along the field
- **Particles**: Point-based visualization

### Interactive Controls
- **Dimension Switch**: Toggle between 2D (XY plane) and 3D (XYZ space)
- **Adjustable Density**: Control the number of vectors displayed (5-30 per axis)
- **Arrow Scale**: Adjust vector size for better visibility
- **Domain Control**: Set custom X, Y, Z ranges
- **Color Modes**:
  - Magnitude: Blue (low) to Red (high)
  - Direction: Hue-based directional coloring
  - Solid: Single color display

### Advanced Features
- **Animation**: Time-varying fields (use `t` variable in expressions)
- **Preset Examples**: Quick-load common vector fields
  - Circular flow
  - Radial expansion
  - Wave patterns
  - Vortex
  - Saddle point
  - 3D circular flow
- **Export**: Save visualizations as PNG images
- **Real-time Stats**: View point count and maximum magnitude

## Usage

### Getting Started

1. **Open the App**: Simply open `index.html` in a modern web browser
2. **Enter Expression**: Type a vector field expression in the input box
3. **Click Update**: Click "Update Visualization" or press Enter

### Expression Syntax

Use standard mathematical notation:

**Unit Vectors:**
- `i` = x-direction
- `j` = y-direction  
- `k` = z-direction

**Variables:**
- `x`, `y`, `z` = spatial coordinates
- `t` = time (for animations)

**Functions:**
- `sin()`, `cos()`, `tan()`
- `exp()`, `log()`, `sqrt()`
- `abs()`, `ceil()`, `floor()`

**Operators:**
- `+`, `-`, `*`, `/`, `^` (power)

### Example Expressions

**2D Fields:**
```
i*(-y) + j*x                    // Circular flow
i*x + j*y                       // Radial expansion
i*sin(y) + j*sin(x)            // Wave pattern
i*(-y/(x^2+y^2)) + j*(x/(x^2+y^2))  // Vortex
i*cos(x)*sin(y) + j*sin(x)*cos(y)   // Saddle point
```

**3D Fields:**
```
i*(-y) + j*x + k*z             // 3D helical flow
i*x + j*y + k*z                // Radial expansion from origin
i*sin(z) + j*cos(z) + k*0      // Z-dependent rotation
```

**Time-Varying (Animated):**
```
i*cos(t)*x + j*sin(t)*y        // Rotating field
i*sin(x-t) + j*cos(y-t)        // Traveling wave
```

### Controls

**Mouse (3D Mode):**
- **Click + Drag**: Rotate view
- **Scroll**: Zoom in/out

**Keyboard:**
- **Enter**: Update visualization when in expression field

**Buttons:**
- **Update Visualization**: Re-render with current settings
- **Reset View**: Return camera to default position
- **Export Image**: Download current view as PNG

## Technical Details

### Technologies Used
- **Three.js** (r128): 3D rendering and visualization
- **Math.js** (11.11.0): Expression parsing and evaluation
- **Vanilla JavaScript**: No framework dependencies
- **Modern CSS**: Gradient backgrounds and smooth animations

### Architecture

The application consists of four main components:

1. **index.html**: UI structure and controls
2. **style.css**: Modern, responsive styling
3. **vectorField.js**: Vector field parsing and computation
4. **renderer.js**: Three.js-based 3D/2D rendering
5. **app.js**: Main application logic and event handling

### Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL support.

## Tips & Tricks

1. **Avoid Singularities**: Be careful with expressions like `1/x` or `1/(x^2+y^2)` that have singularities. The app filters vectors with magnitude > 1000.

2. **Adjust Density**: Lower density (5-10) for complex 3D fields, higher density (20-30) for smooth 2D visualizations.

3. **Scale Matters**: If vectors are too small/large, adjust the "Arrow Scale" slider.

4. **Animation Performance**: Use lower density when animating for smoother framerates.

5. **Domain Range**: Adjust X, Y, Z ranges to focus on interesting regions of your field.

6. **Color by Direction**: Use "Direction" color mode to see field rotation patterns more clearly.

## Future Enhancements

Potential features for future versions:
- Streamline integration (true field lines following flow)
- Divergence and curl visualization
- Vector field composition (overlay multiple fields)
- Coordinate system transforms (polar, cylindrical, spherical)
- Field line tracing with particle animation
- More export formats (SVG, WebM video)
- Save/load configurations
- URL sharing with encoded parameters

## License

Free to use and modify for educational and personal projects.

## Author

Created with GitHub Copilot - February 2026

---

**Enjoy exploring vector fields!** 🎨📐
