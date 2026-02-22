/**
 * Main Application
 * Connects UI controls with vector field computation and rendering
 */

class VectorFieldApp {
    constructor() {
        // Initialize components
        this.vectorField = new VectorField();
        this.renderer = new VectorFieldRenderer(document.getElementById('renderCanvas'));
        
        // State
        this.isAnimating = false;
        this.animationTime = 0;
        this.animationId = null;
        
        // Initialize UI
        this.initializeUI();
        
        // Initial render
        this.updateVisualization();
    }

    /**
     * Initialize all UI event listeners
     */
    initializeUI() {
        // Expression input
        const expressionInput = document.getElementById('vectorExpression');
        expressionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.updateVisualization();
            }
        });

        // Dimension selector
        const dimensionSelect = document.getElementById('dimension');
        dimensionSelect.addEventListener('change', (e) => {
            const is3D = e.target.value === '3d';
            document.getElementById('zRangeGroup').style.display = is3D ? 'flex' : 'none';
            this.updateVisualization();
        });

        // Render mode
        document.getElementById('renderMode').addEventListener('change', () => {
            this.updateVisualization();
        });

        // Color mode
        document.getElementById('colorMode').addEventListener('change', () => {
            this.updateVisualization();
        });

        // Density slider
        const densitySlider = document.getElementById('density');
        const densityValue = document.getElementById('densityValue');
        densitySlider.addEventListener('input', (e) => {
            densityValue.textContent = e.target.value;
        });
        densitySlider.addEventListener('change', () => {
            this.updateVisualization();
        });

        // Scale slider
        const scaleSlider = document.getElementById('scale');
        const scaleValue = document.getElementById('scaleValue');
        scaleSlider.addEventListener('input', (e) => {
            scaleValue.textContent = parseFloat(e.target.value).toFixed(2);
        });
        scaleSlider.addEventListener('change', () => {
            this.updateVisualization();
        });

        // Animation
        const animateCheckbox = document.getElementById('animate');
        animateCheckbox.addEventListener('change', (e) => {
            this.isAnimating = e.target.checked;
            if (this.isAnimating) {
                this.startAnimation();
            } else {
                this.stopAnimation();
            }
        });

        // Animation speed
        const animSpeedSlider = document.getElementById('animSpeed');
        const animSpeedValue = document.getElementById('animSpeedValue');
        animSpeedSlider.addEventListener('input', (e) => {
            animSpeedValue.textContent = parseFloat(e.target.value).toFixed(1);
        });

        // Buttons
        document.getElementById('updateBtn').addEventListener('click', () => {
            this.updateVisualization();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.renderer.resetView();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.renderer.exportImage();
        });

        // Preset buttons
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const expr = e.target.dataset.expr;
                const dim = e.target.dataset.dim;
                
                document.getElementById('vectorExpression').value = expr;
                document.getElementById('dimension').value = dim;
                
                // Show/hide z range
                const is3D = dim === '3d';
                document.getElementById('zRangeGroup').style.display = is3D ? 'flex' : 'none';
                
                this.updateVisualization();
            });
        });
    }

    /**
     * Get current settings from UI
     */
    getSettings() {
        return {
            expression: document.getElementById('vectorExpression').value,
            dimension: document.getElementById('dimension').value === '3d' ? 3 : 2,
            renderMode: document.getElementById('renderMode').value,
            colorMode: document.getElementById('colorMode').value,
            density: parseInt(document.getElementById('density').value),
            scale: parseFloat(document.getElementById('scale').value),
            bounds: {
                xMin: parseFloat(document.getElementById('xMin').value),
                xMax: parseFloat(document.getElementById('xMax').value),
                yMin: parseFloat(document.getElementById('yMin').value),
                yMax: parseFloat(document.getElementById('yMax').value),
                zMin: parseFloat(document.getElementById('zMin').value),
                zMax: parseFloat(document.getElementById('zMax').value)
            },
            animSpeed: parseFloat(document.getElementById('animSpeed').value)
        };
    }

    /**
     * Update visualization with current settings
     */
    updateVisualization() {
        const settings = this.getSettings();
        const errorDiv = document.getElementById('expressionError');

        // Parse vector field
        const success = this.vectorField.parse(settings.expression, settings.dimension);
        
        if (!success) {
            errorDiv.textContent = `Error: ${this.vectorField.error}`;
            return;
        } else {
            errorDiv.textContent = '';
        }

        // Generate field samples
        const samples = this.vectorField.generateGrid(
            settings.bounds,
            settings.density,
            this.animationTime
        );

        // Find max magnitude
        const maxMag = this.vectorField.findMaxMagnitude(samples);

        // Update stats
        document.getElementById('pointCount').textContent = samples.length;
        document.getElementById('maxMag').textContent = maxMag.toFixed(2);

        // Render
        this.renderer.renderVectorField(samples, {
            dimension: settings.dimension,
            renderMode: settings.renderMode,
            colorMode: settings.colorMode,
            scale: settings.scale,
            maxMag: maxMag
        });
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        const animate = () => {
            if (!this.isAnimating) return;

            const settings = this.getSettings();
            this.animationTime += 0.016 * settings.animSpeed; // ~60fps

            // Update visualization with new time
            const samples = this.vectorField.generateGrid(
                settings.bounds,
                settings.density,
                this.animationTime
            );

            const maxMag = this.vectorField.findMaxMagnitude(samples);

            this.renderer.renderVectorField(samples, {
                dimension: settings.dimension,
                renderMode: settings.renderMode,
                colorMode: settings.colorMode,
                scale: settings.scale,
                maxMag: maxMag
            });

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop animation
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VectorFieldApp();
    
    // Start render loop
    window.app.renderer.animate();
});
