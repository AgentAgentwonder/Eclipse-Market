import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { SplitConfig } from '../../types/workspace';

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical';
  initialSizes?: number[];
  minSizes?: number[];
  children: ReactNode[];
  onSizesChange?: (sizes: number[]) => void;
  splitConfig?: SplitConfig;
}

export const SplitPane = ({
  direction,
  initialSizes,
  minSizes = [],
  children,
  onSizesChange,
}: SplitPaneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<number[]>(() => {
    if (initialSizes && initialSizes.length === children.length) {
      return initialSizes;
    }
    const equalSize = 100 / children.length;
    return Array(children.length).fill(equalSize);
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(-1);
  const lastClickTime = useRef<{ [key: number]: number }>({});

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragIndex(index);
    
    const now = Date.now();
    const lastClick = lastClickTime.current[index] || 0;
    
    if (now - lastClick < 300) {
      const equalSize = 100 / children.length;
      const newSizes = Array(children.length).fill(equalSize);
      setSizes(newSizes);
      onSizesChange?.(newSizes);
    }
    
    lastClickTime.current[index] = now;
  }, [children.length, onSizesChange]);

  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragIndex(index);
  }, []);

  useEffect(() => {
    if (!isDragging || dragIndex === -1) return;

    const handleMove = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      const isHorizontal = direction === 'horizontal';
      const totalSize = isHorizontal ? rect.width : rect.height;
      const mousePos = isHorizontal ? clientX - rect.left : clientY - rect.top;
      const percentage = (mousePos / totalSize) * 100;

      setSizes(prevSizes => {
        const newSizes = [...prevSizes];
        const minSize1 = minSizes[dragIndex] || 10;
        const minSize2 = minSizes[dragIndex + 1] || 10;
        
        const sizeBefore = prevSizes.slice(0, dragIndex + 1).reduce((a, b) => a + b, 0);
        const sizeAfter = prevSizes.slice(dragIndex + 2).reduce((a, b) => a + b, 0);
        
        const availableSpace = 100 - sizeAfter;
        let newSize1 = Math.max(minSize1, Math.min(availableSpace - minSize2, percentage));
        let newSize2 = availableSpace - newSize1;

        if (newSize1 < minSize1) {
          newSize1 = minSize1;
          newSize2 = availableSpace - minSize1;
        }
        if (newSize2 < minSize2) {
          newSize2 = minSize2;
          newSize1 = availableSpace - minSize2;
        }

        newSizes[dragIndex] = newSize1;
        newSizes[dragIndex + 1] = newSize2;

        return newSizes;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setDragIndex(-1);
      onSizesChange?.(sizes);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragIndex, direction, minSizes, onSizesChange, sizes]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} h-full w-full`}
    >
      {children.map((child, index) => (
        <div key={index} className="relative flex">
          <div
            className="overflow-auto"
            style={{
              [isHorizontal ? 'width' : 'height']: `${sizes[index]}%`,
              [isHorizontal ? 'height' : 'width']: '100%',
            }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
              className={`
                ${isHorizontal ? 'w-1 cursor-col-resize h-full' : 'h-1 cursor-row-resize w-full'}
                bg-purple-500/20 hover:bg-purple-500/40 transition-colors
                ${isDragging && dragIndex === index ? 'bg-purple-500/60' : ''}
              `}
              onMouseDown={(e) => handleMouseDown(index, e)}
              onTouchStart={(e) => handleTouchStart(index, e)}
              title="Double-click to reset sizes"
            />
          )}
        </div>
      ))}
    </div>
  );
};
