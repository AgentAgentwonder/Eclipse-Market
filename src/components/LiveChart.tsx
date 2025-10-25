import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api';

export function LiveChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial chart setup
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // TODO: Connect to real-time data stream
    // For now just draw some mock data
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const dataPoints = Array(50).fill(0).map((_, i) => {
      return 100 + Math.sin(i / 5) * 5;
    });
    
    dataPoints.forEach((value, i) => {
      const x = (i / dataPoints.length) * canvas.width;
      const y = canvas.height - ((value - 95) / 10) * canvas.height;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();

    // Cleanup
    return () => {
      // TODO: Disconnect from data stream
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Price Chart</h2>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={400}
        className="w-full h-64 bg-gray-900 rounded"
      />
    </div>
  );
}
