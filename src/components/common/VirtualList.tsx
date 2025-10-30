import React, { CSSProperties } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  width?: string | number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  width = '100%',
  renderItem,
  className,
  overscanCount = 5,
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>{renderItem(items[index], index)}</div>
  );

  return (
    <List
      className={className}
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      overscanCount={overscanCount}
    >
      {Row}
    </List>
  );
}
