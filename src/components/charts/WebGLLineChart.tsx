import React, { useEffect, useRef, useState } from 'react';
import { WebGLRenderer } from '../../utils/gpu';
import { usePerformanceStore } from '../../store/performanceStore';

interface ChartDataPoint {
  x: number;
  y: number;
}

interface WebGLLineChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: [number, number, number, number];
  lineWidth?: number;
  minY?: number;
  maxY?: number;
}

export function WebGLLineChart({
  data,
  width = 800,
  height = 400,
  color = [0.65, 0.33, 0.96, 1.0],
  lineWidth = 2,
  minY,
  maxY,
}: WebGLLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const gpuEnabled = usePerformanceStore(state => state.gpuEnabled);
  const gpuSupported = usePerformanceStore(state => state.gpuSupported);

  useEffect(() => {
    if (!canvasRef.current || !gpuEnabled || !gpuSupported) {
      setFallbackMode(true);
      return;
    }

    try {
      if (!rendererRef.current) {
        rendererRef.current = new WebGLRenderer(canvasRef.current);
      }

      const renderer = rendererRef.current;
      renderer.resize(width, height);
      renderer.clear(0, 0, 0, 0);

      if (data.length < 2) return;

      const dataMinY = minY ?? Math.min(...data.map(d => d.y));
      const dataMaxY = maxY ?? Math.max(...data.map(d => d.y));
      const dataMinX = Math.min(...data.map(d => d.x));
      const dataMaxX = Math.max(...data.map(d => d.x));

      const padding = 0.1;
      const yRange = dataMaxY - dataMinY || 1;
      const xRange = dataMaxX - dataMinX || 1;

      const scaleX = (x: number) => {
        return -1 + 2 * ((x - dataMinX) / xRange);
      };

      const scaleY = (y: number) => {
        return -1 + padding + (2 - 2 * padding) * ((y - dataMinY) / yRange);
      };

      const points = new Float32Array(data.length * 2);
      for (let i = 0; i < data.length; i++) {
        points[i * 2] = scaleX(data[i].x);
        points[i * 2 + 1] = scaleY(data[i].y);
      }

      renderer.drawLineStrip(points, color);

      const stats = renderer.getStats();
      usePerformanceStore.getState().setGpuStats(stats);
    } catch (err) {
      console.error('WebGL rendering failed, falling back to Canvas2D:', err);
      setFallbackMode(true);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.resetStats();
      }
    };
  }, [data, width, height, color, gpuEnabled, gpuSupported, minY, maxY]);

  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  if (fallbackMode || !gpuEnabled || !gpuSupported) {
    return <Canvas2DLineChart data={data} width={width} height={height} color={color} minY={minY} maxY={maxY} />;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: 'auto', maxWidth: `${width}px` }}
    />
  );
}

interface Canvas2DLineChartProps extends WebGLLineChartProps {}

function Canvas2DLineChart({
  data,
  width = 800,
  height = 400,
  color = [0.65, 0.33, 0.96, 1.0],
  minY,
  maxY,
}: Canvas2DLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    const dataMinY = minY ?? Math.min(...data.map(d => d.y));
    const dataMaxY = maxY ?? Math.max(...data.map(d => d.y));
    const dataMinX = Math.min(...data.map(d => d.x));
    const dataMaxX = Math.max(...data.map(d => d.x));

    const padding = 40;
    const yRange = dataMaxY - dataMinY || 1;
    const xRange = dataMaxX - dataMinX || 1;

    const scaleX = (x: number) => {
      return padding + ((x - dataMinX) / xRange) * (width - 2 * padding);
    };

    const scaleY = (y: number) => {
      return height - padding - ((y - dataMinY) / yRange) * (height - 2 * padding);
    };

    ctx.strokeStyle = `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${color[3]})`;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(scaleX(data[0].x), scaleY(data[0].y));

    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(scaleX(data[i].x), scaleY(data[i].y));
    }

    ctx.stroke();
  }, [data, width, height, color, minY, maxY]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: 'auto', maxWidth: `${width}px` }}
    />
  );
}
