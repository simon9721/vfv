/**
 * Vector Field Renderer using Three.js
 * Handles 2D and 3D visualization with multiple render modes
 */

class VectorFieldRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.vectorObjects = [];
        this.dimension = 2;
        this.renderMode = 'arrows';
        this.colorMode = 'magnitude';
        this.particles = [];
        this.animationTime = 0;

        this.initThreeJS();
    }

    /**
     * Initialize Three.js scene, camera, renderer
     */
    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf8f9fa);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Add axes and grid
        this.addAxesAndGrid();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Mouse controls
        this.addMouseControls();
    }

    /**
     * Add axes and grid helpers
     */
    addAxesAndGrid() {
        // Remove old helpers
        const oldHelpers = this.scene.children.filter(
            child => child instanceof THREE.GridHelper || 
                     child instanceof THREE.AxesHelper ||
                     child.name === 'gridHelper'
        );
        oldHelpers.forEach(helper => this.scene.remove(helper));

        if (this.dimension === 2) {
            // 2D Grid (on XY plane)
            const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
            gridHelper.rotation.x = Math.PI / 2;
            gridHelper.name = 'gridHelper';
            this.scene.add(gridHelper);
        } else {
            // 3D Grid
            const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
            gridHelper.name = 'gridHelper';
            this.scene.add(gridHelper);
        }

        // Axes
        const axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper);
    }

    /**
     * Add mouse controls for camera
     */
    addMouseControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        const rotationSpeed = 0.005;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            // Rotate camera around origin
            const radius = Math.sqrt(
                this.camera.position.x ** 2 +
                this.camera.position.y ** 2 +
                this.camera.position.z ** 2
            );

            const theta = Math.atan2(this.camera.position.x, this.camera.position.z);
            const phi = Math.acos(this.camera.position.y / radius);

            const newTheta = theta - deltaX * rotationSpeed;
            const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * rotationSpeed));

            this.camera.position.x = radius * Math.sin(newPhi) * Math.sin(newTheta);
            this.camera.position.y = radius * Math.cos(newPhi);
            this.camera.position.z = radius * Math.sin(newPhi) * Math.cos(newTheta);
            this.camera.lookAt(0, 0, 0);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const distance = Math.sqrt(
                this.camera.position.x ** 2 +
                this.camera.position.y ** 2 +
                this.camera.position.z ** 2
            );

            const newDistance = distance + (e.deltaY > 0 ? zoomSpeed : -zoomSpeed);
            const scale = newDistance / distance;

            this.camera.position.multiplyScalar(scale);
        });
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    /**
     * Clear all vector objects from the scene
     */
    clearVectors() {
        this.vectorObjects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            this.scene.remove(obj);
        });
        this.vectorObjects = [];
    }

    /**
     * Render vector field
     * @param {array} samples - Array of field samples
     * @param {object} options - Rendering options
     */
    renderVectorField(samples, options = {}) {
        const {
            dimension = 2,
            renderMode = 'arrows',
            colorMode = 'magnitude',
            scale = 0.3,
            maxMag = 1
        } = options;

        this.dimension = dimension;
        this.renderMode = renderMode;
        this.colorMode = colorMode;

        // Clear previous vectors
        this.clearVectors();

        // Update grid for dimension
        this.addAxesAndGrid();

        // Adjust camera for 2D/3D
        if (dimension === 2 && this.camera.position.z < 10) {
            this.camera.position.set(0, 0, 15);
        }

        // Render based on mode
        switch (renderMode) {
            case 'arrows':
                this.renderArrows(samples, scale, maxMag);
                break;
            case 'lines':
                this.renderFieldLines(samples, scale, maxMag);
                break;
            case 'particles':
                this.renderParticles(samples, maxMag);
                break;
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Render arrows
     */
    renderArrows(samples, scale, maxMag) {
        samples.forEach(sample => {
            const { pos, vec, mag } = sample;
            
            // Skip very small vectors
            if (mag < 0.001) return;

            // Create arrow
            const direction = new THREE.Vector3(vec.x, vec.y, vec.z).normalize();
            const length = mag * scale * 2;
            const color = this.getColor(mag, maxMag, direction);

            const arrowHelper = new THREE.ArrowHelper(
                direction,
                new THREE.Vector3(pos.x, pos.y, pos.z),
                length,
                color,
                length * 0.2,
                length * 0.1
            );

            this.scene.add(arrowHelper);
            this.vectorObjects.push(arrowHelper);
        });
    }

    /**
     * Render field lines
     */
    renderFieldLines(samples, scale, maxMag) {
        samples.forEach(sample => {
            const { pos, vec, mag } = sample;
            
            if (mag < 0.001) return;

            // Create a line along the vector
            const direction = new THREE.Vector3(vec.x, vec.y, vec.z).normalize();
            const length = mag * scale * 2;

            const start = new THREE.Vector3(pos.x, pos.y, pos.z);
            const end = start.clone().add(direction.multiplyScalar(length));

            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            const color = this.getColor(mag, maxMag, direction);
            const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
            const line = new THREE.Line(geometry, material);

            this.scene.add(line);
            this.vectorObjects.push(line);
        });
    }

    /**
     * Render particles
     */
    renderParticles(samples, maxMag) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        samples.forEach(sample => {
            const { pos, vec, mag } = sample;
            
            positions.push(pos.x, pos.y, pos.z);

            const direction = new THREE.Vector3(vec.x, vec.y, vec.z).normalize();
            const color = new THREE.Color(this.getColor(mag, maxMag, direction));
            colors.push(color.r, color.g, color.b);
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true
        });

        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        this.vectorObjects.push(points);
    }

    /**
     * Get color based on color mode
     */
    getColor(magnitude, maxMag, direction) {
        switch (this.colorMode) {
            case 'magnitude':
                // Color from blue (low) to red (high)
                const ratio = Math.min(magnitude / maxMag, 1);
                return new THREE.Color().setHSL(0.6 - ratio * 0.6, 1, 0.5);

            case 'direction':
                // Color based on direction
                const hue = (Math.atan2(direction.y, direction.x) / (2 * Math.PI) + 0.5) % 1;
                return new THREE.Color().setHSL(hue, 1, 0.5);

            case 'solid':
                return 0x667eea;

            default:
                return 0x667eea;
        }
    }

    /**
     * Reset camera view
     */
    resetView() {
        if (this.dimension === 2) {
            this.camera.position.set(0, 0, 15);
        } else {
            this.camera.position.set(10, 10, 10);
        }
        this.camera.lookAt(0, 0, 0);
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Export canvas as image
     */
    exportImage() {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'vector-field.png';
        link.href = dataURL;
        link.click();
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}
