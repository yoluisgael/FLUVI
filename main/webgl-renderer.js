// WebGL Renderer for FLUVI Traffic Simulator
// Provides hardware-accelerated rendering with fallback to Canvas 2D

class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.programs = {};
        this.buffers = {};
        this.textures = {};
        this.isWebGLAvailable = false;

        // Rendering state
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);

        this.init();
    }

    init() {
        // Try to get WebGL context
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

        if (!this.gl) {
            console.warn('WebGL not supported, falling back to Canvas 2D');
            return false;
        }

        this.isWebGLAvailable = true;

        // Set up WebGL state
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        // Initialize shaders and buffers
        this.initShaders();
        this.initBuffers();

        return true;
    }

    initShaders() {
        // Vertex shader for textured sprites (roads and cars)
        const spriteVertexShader = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_modelMatrix;

            varying vec2 v_texCoord;

            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;

        // Fragment shader for textured sprites
        const spriteFragmentShader = `
            precision mediump float;

            uniform sampler2D u_texture;
            uniform float u_alpha;

            varying vec2 v_texCoord;

            void main() {
                vec4 texColor = texture2D(u_texture, v_texCoord);
                gl_FragColor = vec4(texColor.rgb, texColor.a * u_alpha);
            }
        `;

        // Vertex shader for solid colors (background, intersections)
        const colorVertexShader = `
            attribute vec2 a_position;

            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_modelMatrix;

            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
            }
        `;

        // Fragment shader for solid colors
        const colorFragmentShader = `
            precision mediump float;

            uniform vec4 u_color;

            void main() {
                gl_FragColor = u_color;
            }
        `;

        // Create shader programs
        this.programs.sprite = this.createProgram(spriteVertexShader, spriteFragmentShader);
        this.programs.color = this.createProgram(colorVertexShader, colorFragmentShader);

        // Get attribute and uniform locations for sprite program
        this.programs.sprite.locations = {
            attributes: {
                position: this.gl.getAttribLocation(this.programs.sprite, 'a_position'),
                texCoord: this.gl.getAttribLocation(this.programs.sprite, 'a_texCoord')
            },
            uniforms: {
                viewMatrix: this.gl.getUniformLocation(this.programs.sprite, 'u_viewMatrix'),
                projectionMatrix: this.gl.getUniformLocation(this.programs.sprite, 'u_projectionMatrix'),
                modelMatrix: this.gl.getUniformLocation(this.programs.sprite, 'u_modelMatrix'),
                texture: this.gl.getUniformLocation(this.programs.sprite, 'u_texture'),
                alpha: this.gl.getUniformLocation(this.programs.sprite, 'u_alpha')
            }
        };

        // Get attribute and uniform locations for color program
        this.programs.color.locations = {
            attributes: {
                position: this.gl.getAttribLocation(this.programs.color, 'a_position')
            },
            uniforms: {
                viewMatrix: this.gl.getUniformLocation(this.programs.color, 'u_viewMatrix'),
                projectionMatrix: this.gl.getUniformLocation(this.programs.color, 'u_projectionMatrix'),
                modelMatrix: this.gl.getUniformLocation(this.programs.color, 'u_modelMatrix'),
                color: this.gl.getUniformLocation(this.programs.color, 'u_color')
            }
        };
    }

    createShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(vertexShaderSource, fragmentShaderSource) {
        const vertexShader = this.createShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.createShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    initBuffers() {
        // Create quad buffer for sprites (2 triangles)
        const quadVertices = new Float32Array([
            // Position  // TexCoord
            0.0, 0.0,    0.0, 0.0,
            1.0, 0.0,    1.0, 0.0,
            0.0, 1.0,    0.0, 1.0,
            1.0, 1.0,    1.0, 1.0
        ]);

        const quadIndices = new Uint16Array([0, 1, 2, 1, 3, 2]);

        this.buffers.quad = {
            vertex: this.gl.createBuffer(),
            index: this.gl.createBuffer()
        };

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quad.vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.quad.index);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, quadIndices, this.gl.STATIC_DRAW);

        // Create circle buffer for intersections
        const circleSegments = 16;
        const circleVertices = new Float32Array((circleSegments + 2) * 2);

        // Center point
        circleVertices[0] = 0.0;
        circleVertices[1] = 0.0;

        // Circle points
        for (let i = 0; i <= circleSegments; i++) {
            const angle = (i / circleSegments) * 2 * Math.PI;
            circleVertices[(i + 1) * 2] = Math.cos(angle);
            circleVertices[(i + 1) * 2 + 1] = Math.sin(angle);
        }

        this.buffers.circle = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.circle);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, circleVertices, this.gl.STATIC_DRAW);
        this.buffers.circleVertexCount = circleSegments + 2;
    }

    loadTexture(image) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        // Upload image data
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

        return texture;
    }

    setTextures(carroImg, carreteraImg) {
        if (!this.isWebGLAvailable) return;

        this.textures.carro = this.loadTexture(carroImg);
        this.textures.carretera = this.loadTexture(carreteraImg);
    }

    updateViewport(width, height, escala, offsetX, offsetY) {
        if (!this.isWebGLAvailable) return;

        this.gl.viewport(0, 0, width, height);

        // Update projection matrix (orthographic)
        this.setOrthographicProjection(0, width, height, 0, -1, 1);

        // Update view matrix (scale and translation)
        this.setViewMatrix(escala, offsetX, offsetY);
    }

    setOrthographicProjection(left, right, bottom, top, near, far) {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        this.projectionMatrix[0] = -2 * lr;
        this.projectionMatrix[1] = 0;
        this.projectionMatrix[2] = 0;
        this.projectionMatrix[3] = 0;
        this.projectionMatrix[4] = 0;
        this.projectionMatrix[5] = -2 * bt;
        this.projectionMatrix[6] = 0;
        this.projectionMatrix[7] = 0;
        this.projectionMatrix[8] = 0;
        this.projectionMatrix[9] = 0;
        this.projectionMatrix[10] = 2 * nf;
        this.projectionMatrix[11] = 0;
        this.projectionMatrix[12] = (left + right) * lr;
        this.projectionMatrix[13] = (top + bottom) * bt;
        this.projectionMatrix[14] = (far + near) * nf;
        this.projectionMatrix[15] = 1;
    }

    setViewMatrix(scale, offsetX, offsetY) {
        // Identity matrix
        this.viewMatrix.fill(0);
        this.viewMatrix[0] = scale;
        this.viewMatrix[5] = scale;
        this.viewMatrix[10] = 1;
        this.viewMatrix[12] = offsetX;
        this.viewMatrix[13] = offsetY;
        this.viewMatrix[15] = 1;
    }

    clear(r = 0.78, g = 0.8, b = 0.8, a = 1.0) {
        if (!this.isWebGLAvailable) return;

        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    drawSprite(texture, x, y, width, height, rotation = 0, alpha = 1.0) {
        if (!this.isWebGLAvailable) return;

        // Use sprite shader program
        this.gl.useProgram(this.programs.sprite);

        // Set up model matrix (translation, rotation, scale)
        const modelMatrix = new Float32Array(16);
        this.setModelMatrix(modelMatrix, x, y, width, height, rotation);

        // Set uniforms
        this.gl.uniformMatrix4fv(this.programs.sprite.locations.uniforms.projectionMatrix, false, this.projectionMatrix);
        this.gl.uniformMatrix4fv(this.programs.sprite.locations.uniforms.viewMatrix, false, this.viewMatrix);
        this.gl.uniformMatrix4fv(this.programs.sprite.locations.uniforms.modelMatrix, false, modelMatrix);
        this.gl.uniform1f(this.programs.sprite.locations.uniforms.alpha, alpha);

        // Bind texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.programs.sprite.locations.uniforms.texture, 0);

        // Bind vertex buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quad.vertex);

        // Set up attributes
        this.gl.enableVertexAttribArray(this.programs.sprite.locations.attributes.position);
        this.gl.vertexAttribPointer(this.programs.sprite.locations.attributes.position, 2, this.gl.FLOAT, false, 16, 0);

        this.gl.enableVertexAttribArray(this.programs.sprite.locations.attributes.texCoord);
        this.gl.vertexAttribPointer(this.programs.sprite.locations.attributes.texCoord, 2, this.gl.FLOAT, false, 16, 8);

        // Bind index buffer and draw
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.quad.index);
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }

    drawCircle(x, y, radius, r, g, b, a = 1.0) {
        if (!this.isWebGLAvailable) return;

        // Use color shader program
        this.gl.useProgram(this.programs.color);

        // Set up model matrix
        const modelMatrix = new Float32Array(16);
        this.setModelMatrix(modelMatrix, x - radius, y - radius, radius * 2, radius * 2, 0);

        // Set uniforms
        this.gl.uniformMatrix4fv(this.programs.color.locations.uniforms.projectionMatrix, false, this.projectionMatrix);
        this.gl.uniformMatrix4fv(this.programs.color.locations.uniforms.viewMatrix, false, this.viewMatrix);
        this.gl.uniformMatrix4fv(this.programs.color.locations.uniforms.modelMatrix, false, modelMatrix);
        this.gl.uniform4f(this.programs.color.locations.uniforms.color, r, g, b, a);

        // Bind vertex buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.circle);

        // Set up attributes
        this.gl.enableVertexAttribArray(this.programs.color.locations.attributes.position);
        this.gl.vertexAttribPointer(this.programs.color.locations.attributes.position, 2, this.gl.FLOAT, false, 0, 0);

        // Draw circle as triangle fan
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.buffers.circleVertexCount);
    }

    drawRect(x, y, width, height, r, g, b, a = 1.0) {
        if (!this.isWebGLAvailable) return;

        // Use color shader program
        this.gl.useProgram(this.programs.color);

        // Set up model matrix
        const modelMatrix = new Float32Array(16);
        this.setModelMatrix(modelMatrix, x, y, width, height, 0);

        // Set uniforms
        this.gl.uniformMatrix4fv(this.programs.color.locations.uniforms.projectionMatrix, false, this.projectionMatrix);
        this.gl.uniformMatrix4fv(this.programs.color.locations.uniforms.viewMatrix, false, this.viewMatrix);
        this.gl.uniformMatrix4fv(this.programs.color.locations.uniforms.modelMatrix, false, modelMatrix);
        this.gl.uniform4f(this.programs.color.locations.uniforms.color, r, g, b, a);

        // Bind vertex buffer (reuse quad buffer but only position data)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quad.vertex);

        // Set up attributes
        this.gl.enableVertexAttribArray(this.programs.color.locations.attributes.position);
        this.gl.vertexAttribPointer(this.programs.color.locations.attributes.position, 2, this.gl.FLOAT, false, 16, 0);

        // Bind index buffer and draw
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.quad.index);
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }

    setModelMatrix(matrix, x, y, width, height, rotation) {
        // Reset to identity
        matrix.fill(0);
        matrix[0] = 1;
        matrix[5] = 1;
        matrix[10] = 1;
        matrix[15] = 1;

        // Apply transformations: translate -> rotate -> scale
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        // Scale
        matrix[0] = width * cos;
        matrix[1] = width * sin;
        matrix[4] = -height * sin;
        matrix[5] = height * cos;

        // Translation
        matrix[12] = x;
        matrix[13] = y;
    }
}