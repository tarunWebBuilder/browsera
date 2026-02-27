"use client";
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

interface CellProps {
  row: number;
  col: number;
  width: number;
  height: number;
  virtualStart: { x: number; y: number };
  isSelected: boolean;
  isEditing: boolean;
  displayValue: string;
  formulaValue: string;
  onCellClick: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onCellChange: (value: string) => void;
  finishEditing: () => void;
}

const Cell: React.FC<CellProps> = ({
  row,
  col,
  width,
  height,
  virtualStart,
  isSelected,
  isEditing,
  displayValue,
  formulaValue,
  onCellClick,
  onCellDoubleClick,
  onCellChange,
  finishEditing,
}) => {
  const cellInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
  }, [isEditing, formulaValue]);

  //  `w-[${width}px] h-[${height}px] translate-x-[${virtualStart.x}px] translate-y-[${virtualStart.y}px]`
  return (
    <div
      className={cn(
        'sheet-cell absolute',
        isSelected && 'sheet-cell-selected',
        isEditing && 'sheet-cell-editing'
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${virtualStart.x}px, ${virtualStart.y}px)`,
      }}
      onClick={() => onCellClick(row, col)}
      onDoubleClick={() => onCellDoubleClick(row, col)}
    >
      {isEditing ? (
        <input
          ref={cellInputRef}
          className="size-full bg-white text-gray-900 outline-none"
          value={formulaValue}
          onChange={(e) => onCellChange(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              finishEditing();
              e.preventDefault();
            }
          }}
        />
      ) : (
        <span className="text-gray-900 dark:text-white">{displayValue}</span>
      )}
    </div>
  );
};

export default Cell;
