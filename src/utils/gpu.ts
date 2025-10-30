export interface GPUInfo {
  supported: boolean;
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  webglVersion: number;
}

export interface GPUStats {
  memoryUsed: number;
  memoryTotal: number;
  drawCalls: number;
  triangles: number;
}

let cachedGPUInfo: GPUInfo | null = null;

export function detectGPUSupport(): GPUInfo {
  if (cachedGPUInfo) return cachedGPUInfo;

  if (typeof document === 'undefined') {
    return {
      supported: false,
      renderer: 'N/A',
      vendor: 'N/A',
      maxTextureSize: 0,
      webglVersion: 0,
    };
  }

  const canvas = document.createElement('canvas');
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let webglVersion = 0;

  try {
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      return {
        supported: false,
        renderer: 'N/A',
        vendor: 'N/A',
        maxTextureSize: 0,
        webglVersion: 0,
      };
    }

    webglVersion = gl instanceof WebGL2RenderingContext ? 2 : 1;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : gl.getParameter(gl.VENDOR);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    cachedGPUInfo = {
      supported: true,
      renderer: String(renderer),
      vendor: String(vendor),
      maxTextureSize: Number(maxTextureSize),
      webglVersion,
    };

    return cachedGPUInfo;
  } catch (error) {
    console.warn('GPU detection failed:', error);
    return {
      supported: false,
      renderer: 'N/A',
      vendor: 'N/A',
      maxTextureSize: 0,
      webglVersion: 0,
    };
  } finally {
    if (gl && gl.getExtension('WEBGL_lose_context')) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Failed to compile shader: ${info}`);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create WebGL program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Failed to link program: ${info}`);
  }

  return program;
}

const VERTEX_SHADER_SOURCE = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform vec4 color;
  void main() {
    gl_FragColor = color;
  }
`;

export class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private positionLocation: number;
  private colorLocation: WebGLUniformLocation | null;
  private positionBuffer: WebGLBuffer;
  private drawCallCount = 0;
  private triangleCount = 0;

  constructor(canvas: HTMLCanvasElement) {
    const context = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;

    if (!context) {
      throw new Error('WebGL not supported');
    }

    this.canvas = canvas;
    this.gl = context;
    this.program = createProgram(this.gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    this.positionLocation = this.gl.getAttribLocation(this.program, 'position');
    this.colorLocation = this.gl.getUniformLocation(this.program, 'color');
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create buffer');
    }
    this.positionBuffer = buffer;

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  public resize(width: number, height: number) {
    if (this.canvas.width === width && this.canvas.height === height) {
      return;
    }
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  public clear(r: number, g: number, b: number, a: number): void {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private draw(points: Float32Array, mode: number, color: [number, number, number, number]) {
    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, points, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    if (this.colorLocation) {
      this.gl.uniform4fv(this.colorLocation, color);
    }
    this.gl.drawArrays(mode, 0, points.length / 2);

    this.drawCallCount += 1;
    if (mode === this.gl.TRIANGLES) {
      this.triangleCount += points.length / 6;
    } else if (mode === this.gl.TRIANGLE_STRIP) {
      this.triangleCount += Math.max(0, (points.length / 2) - 2);
    }
  }

  public drawLineStrip(points: Float32Array, color: [number, number, number, number]) {
    this.draw(points, this.gl.LINE_STRIP, color);
  }

  public drawTriangleStrip(points: Float32Array, color: [number, number, number, number]) {
    this.draw(points, this.gl.TRIANGLE_STRIP, color);
  }

  public getStats(): GPUStats {
    const memoryInfo = (performance as any).memory;

    return {
      memoryUsed: memoryInfo?.usedJSHeapSize || 0,
      memoryTotal: memoryInfo?.totalJSHeapSize || 0,
      drawCalls: this.drawCallCount,
      triangles: this.triangleCount,
    };
  }

  public resetStats(): void {
    this.drawCallCount = 0;
    this.triangleCount = 0;
  }

  public dispose(): void {
    this.gl.deleteBuffer(this.positionBuffer);
    this.gl.deleteProgram(this.program);
    if (this.gl.getExtension('WEBGL_lose_context')) {
      this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }
}

export function estimateGPUMemoryUsage(canvas: HTMLCanvasElement): number {
  const width = canvas.width || canvas.clientWidth || 0;
  const height = canvas.height || canvas.clientHeight || 0;
  const bytesPerPixel = 4;
  return (width * height * bytesPerPixel) / (1024 * 1024);
}
