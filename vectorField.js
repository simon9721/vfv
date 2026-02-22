/**
 * Vector Field Parser and Evaluator
 * Parses expressions like "i*x + j*y + k*z" and evaluates them at given points
 */

class VectorField {
    constructor() {
        this.expression = '';
        this.dimension = 2;
        this.compiledFunction = null;
        this.error = null;
    }

    /**
     * Parse and compile a vector field expression
     * @param {string} expression - The vector field expression (e.g., "i*(-y) + j*x")
     * @param {number} dimension - 2 for 2D, 3 for 3D
     * @returns {boolean} - True if parsing succeeded
     */
    parse(expression, dimension = 2) {
        this.expression = expression;
        this.dimension = dimension;
        this.error = null;

        try {
            // Preprocess expression to handle common patterns
            expression = this.preprocessExpression(expression);
            
            // Preprocess the expression to extract i, j, k components
            const components = this.extractComponents(expression);
            
            // Compile each component using math.js
            this.compiledFunction = {
                x: components.i ? math.compile(components.i) : null,
                y: components.j ? math.compile(components.j) : null,
                z: components.k && dimension === 3 ? math.compile(components.k) : null
            };

            return true;
        } catch (e) {
            this.error = e.message;
            return false;
        }
    }

    /**
     * Preprocess expression to handle complex patterns like (i*y+j*x)/(denominator)
     */
    preprocessExpression(expression) {
        expression = expression.trim();
        
        // Simple approach: Find pattern (stuff with i,j,k)/denominator and expand it
        // Use a single pass with regex
        
        // Pattern 1: (expression with i/j/k)/function(args)
        // Example: (i*y + j*x)/sqrt(x^2+y^2)
        const pattern1 = /\(([^()]*[ijk][^()]*)\)\/([a-zA-Z_][a-zA-Z0-9_]*\([^)]+\))/g;
        expression = expression.replace(pattern1, (match, numerator, denominator) => {
            const terms = this.splitIntoTerms(numerator);
            return terms.map(term => {
                const t = term.trim();
                if (t.startsWith('+')) {
                    return '+' + t.substring(1).trim() + '/' + denominator;
                } else if (t.startsWith('-')) {
                    return t.trim() + '/' + denominator;
                } else {
                    return t + '/' + denominator;
                }
            }).join('');
        });
        
        // Pattern 2: (expression with i/j/k)/(parenthesized expression)
        // Example: (i*y + j*x)/(x^2+y^2)
        const pattern2 = /\(([^()]*[ijk][^()]*)\)\/\(([^()]+)\)/g;
        expression = expression.replace(pattern2, (match, numerator, denominator) => {
            const terms = this.splitIntoTerms(numerator);
            return terms.map(term => {
                const t = term.trim();
                if (t.startsWith('+')) {
                    return '+' + t.substring(1).trim() + '/(' + denominator + ')';
                } else if (t.startsWith('-')) {
                    return t.trim() + '/(' + denominator + ')';
                } else {
                    return t + '/(' + denominator + ')';
                }
            }).join('');
        });
        
        return expression;
    }

    /**
     * Extract i, j, k components from the expression
     * @param {string} expression
     * @returns {object} - {i: string, j: string, k: string}
     */
    extractComponents(expression) {
        // Remove whitespace
        let expr = expression.replace(/\s+/g, '');

        const components = { i: '0', j: '0', k: '0' };

        // Match patterns like: i*(...), j*(...), k*(...)
        // Also handle: 2*i, -i, i, etc.

        // Replace i, j, k markers with placeholders
        expr = expr.replace(/\*/g, ' * ');
        expr = expr.replace(/\+/g, ' + ');
        expr = expr.replace(/\-/g, ' - ');

        // Split into terms
        const terms = this.splitIntoTerms(expression);

        for (let term of terms) {
            const trimmed = term.trim();
            if (!trimmed) continue;

            // Check which unit vector this term belongs to
            // Use regex to match i, j, k as separate tokens (not inside function names)
            // Match i, j, k that are either:
            // - at start/end of string
            // - preceded/followed by operators or parentheses
            if (/(?:^|[^a-z])i(?:[^a-z]|$)/i.test(trimmed)) {
                const coefficient = this.extractCoefficient(trimmed, 'i');
                components.i = this.addToComponent(components.i, coefficient);
            }
            if (/(?:^|[^a-z])j(?:[^a-z]|$)/i.test(trimmed)) {
                const coefficient = this.extractCoefficient(trimmed, 'j');
                components.j = this.addToComponent(components.j, coefficient);
            }
            if (/(?:^|[^a-z])k(?:[^a-z]|$)/i.test(trimmed)) {
                const coefficient = this.extractCoefficient(trimmed, 'k');
                components.k = this.addToComponent(components.k, coefficient);
            }
        }

        return components;
    }

    /**
     * Split expression into terms (respecting parentheses)
     */
    splitIntoTerms(expression) {
        const terms = [];
        let current = '';
        let parenDepth = 0;
        let sign = '+';

        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];

            if (char === '(') parenDepth++;
            if (char === ')') parenDepth--;

            if ((char === '+' || char === '-') && parenDepth === 0) {
                if (current.trim()) {
                    terms.push(sign + current);
                }
                current = '';
                sign = char;
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            terms.push(sign + current);
        }

        return terms;
    }

    /**
     * Extract coefficient of a unit vector from a term
     */
    extractCoefficient(term, unitVector) {
        // Remove spaces
        term = term.replace(/\s+/g, '');

        // Remove leading + or - and remember the sign
        let sign = 1;
        if (term.startsWith('+')) {
            term = term.substring(1);
        } else if (term.startsWith('-')) {
            sign = -1;
            term = term.substring(1);
        }

        // Remove outer wrapping parentheses if present
        term = term.trim();
        if (term.startsWith('(') && term.endsWith(')')) {
            // Check if these are matching outer parens
            let depth = 0;
            let isOuter = true;
            for (let i = 0; i < term.length; i++) {
                if (term[i] === '(') depth++;
                if (term[i] === ')') depth--;
                if (depth === 0 && i < term.length - 1) {
                    isOuter = false;
                    break;
                }
            }
            if (isOuter) {
                term = term.slice(1, -1);
            }
        }

        // Find the unit vector as a standalone token (not inside function names)
        const regex = new RegExp(`(?:^|[^a-z])(${unitVector})(?:[^a-z]|$)`, 'i');
        const match = term.match(regex);
        
        if (!match) return '0';
        
        const index = match.index + (match[0].startsWith(unitVector) ? 0 : 1);

        // Extract parts before and after the unit vector
        let beforeCoef = term.substring(0, index);
        let afterCoef = term.substring(index + unitVector.length);

        // Remove multiplication signs
        if (beforeCoef.endsWith('*')) {
            beforeCoef = beforeCoef.slice(0, -1);
        }
        if (afterCoef.startsWith('*')) {
            afterCoef = afterCoef.slice(1);
        }

        // Clean up coefficients
        beforeCoef = beforeCoef.trim();
        afterCoef = afterCoef.trim();

        // Determine the coefficient
        let coef = '';
        
        if (beforeCoef && afterCoef) {
            // Has coefficients on both sides (e.g., "2*i*x" -> before="2", after="x")
            coef = `(${beforeCoef})*(${afterCoef})`;
        } else if (beforeCoef) {
            // Has coefficient before (e.g., "y*i")
            coef = beforeCoef;
        } else if (afterCoef) {
            // Has coefficient after (e.g., "i*y")
            coef = afterCoef;
        } else {
            // No coefficient, just the unit vector
            coef = '1';
        }

        // Apply sign
        if (sign === -1) {
            coef = `-(${coef})`;
        }

        return coef;
    }

    /**
     * Add a coefficient to an existing component
     */
    addToComponent(existing, newCoef) {
        if (existing === '0') return newCoef;
        if (newCoef === '0') return existing;
        return `(${existing}) + (${newCoef})`;
    }

    /**
     * Evaluate the vector field at a point
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} t - Time parameter
     * @returns {object} - {x, y, z} components of the vector
     */
    evaluate(x, y, z = 0, t = 0) {
        if (!this.compiledFunction) {
            return { x: 0, y: 0, z: 0 };
        }

        const scope = { x, y, z, t };

        try {
            return {
                x: this.compiledFunction.x ? this.compiledFunction.x.evaluate(scope) : 0,
                y: this.compiledFunction.y ? this.compiledFunction.y.evaluate(scope) : 0,
                z: this.compiledFunction.z ? this.compiledFunction.z.evaluate(scope) : 0
            };
        } catch (e) {
            console.error('Evaluation error:', e);
            return { x: 0, y: 0, z: 0 };
        }
    }

    /**
     * Calculate the magnitude of the vector at a point
     */
    magnitude(x, y, z = 0, t = 0) {
        const vec = this.evaluate(x, y, z, t);
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    }

    /**
     * Generate a grid of vector field samples
     * @param {object} bounds - {xMin, xMax, yMin, yMax, zMin, zMax}
     * @param {number} density - Number of samples per axis
     * @param {number} t - Time parameter
     * @returns {array} - Array of {pos: {x,y,z}, vec: {x,y,z}, mag: number}
     */
    generateGrid(bounds, density, t = 0) {
        const samples = [];
        const { xMin, xMax, yMin, yMax, zMin = 0, zMax = 0 } = bounds;

        if (this.dimension === 2) {
            // 2D grid
            const xStep = (xMax - xMin) / (density - 1);
            const yStep = (yMax - yMin) / (density - 1);

            for (let i = 0; i < density; i++) {
                for (let j = 0; j < density; j++) {
                    const x = xMin + i * xStep;
                    const y = yMin + j * yStep;
                    const vec = this.evaluate(x, y, 0, t);
                    const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);

                    // Skip if magnitude is too large (might be singularity)
                    if (mag < 1000) {
                        samples.push({
                            pos: { x, y, z: 0 },
                            vec,
                            mag
                        });
                    }
                }
            }
        } else {
            // 3D grid
            const xStep = (xMax - xMin) / (density - 1);
            const yStep = (yMax - yMin) / (density - 1);
            const zStep = (zMax - zMin) / (density - 1);

            for (let i = 0; i < density; i++) {
                for (let j = 0; j < density; j++) {
                    for (let k = 0; k < density; k++) {
                        const x = xMin + i * xStep;
                        const y = yMin + j * yStep;
                        const z = zMin + k * zStep;
                        const vec = this.evaluate(x, y, z, t);
                        const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);

                        // Skip if magnitude is too large
                        if (mag < 1000) {
                            samples.push({
                                pos: { x, y, z },
                                vec,
                                mag
                            });
                        }
                    }
                }
            }
        }

        return samples;
    }

    /**
     * Find the maximum magnitude in the field
     */
    findMaxMagnitude(samples) {
        if (samples.length === 0) return 0;
        return Math.max(...samples.map(s => s.mag));
    }

    /**
     * Normalize vector magnitudes for visualization
     */
    normalizeVectors(samples, maxMag) {
        if (maxMag === 0) return samples;

        return samples.map(sample => {
            const scale = sample.mag / maxMag;
            return {
                ...sample,
                normalizedVec: {
                    x: sample.vec.x / maxMag,
                    y: sample.vec.y / maxMag,
                    z: sample.vec.z / maxMag
                },
                normalizedMag: scale
            };
        });
    }
}
