import type { Virtualizer } from '@tanstack/react-virtual';

import { Fragment } from 'react';
import Cell from './cell';





interface GridAreaProps {
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>;
  headerSize: number;
  cellWidth: number;
  cellHeight: number;
  selectedCell: { row: number; col: number } | null;
  editingCell: { row: number; col: number } | null;
  formulaValue: string;
  getCellKey: (col: number, row: number) => string;
  getCellValue: (col: number, row: number) => string;
  data: Map<string, { value: string; formula: string }>;
  handleCellClick: (row: number, col: number) => void;
  handleCellDoubleClick: (row: number, col: number) => void;
  handleCellChange: (value: string) => void;
  finishEditing: () => void;
}

const GridArea: React.FC<GridAreaProps> = ({
  rowVirtualizer,
  columnVirtualizer,
  headerSize,
  cellWidth,
  cellHeight,
  selectedCell,
  editingCell,
  formulaValue,
  getCellKey,
  getCellValue,
  handleCellClick,
  handleCellDoubleClick,
  handleCellChange,
  finishEditing,
}) => {
  return (
    <div
      className="absolute bg-sheet-surface"
      style={{
        transform: `translate(${headerSize}px, ${headerSize}px)`,
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: `${columnVirtualizer.getTotalSize()}px`,
      }}
    >
      <div className="relative">
        {rowVirtualizer.getVirtualItems().map((virtualRow: { index: number; start: number }) => (
          <Fragment key={`row-${virtualRow.index}`}>
            {columnVirtualizer
              .getVirtualItems()
              .map((virtualColumn: { index: number; start: number }) => {
                const key = getCellKey(virtualColumn.index, virtualRow.index);
                const isSelected =
                  selectedCell?.row === virtualRow.index &&
                  selectedCell?.col === virtualColumn.index;
                const isEditing =
                  editingCell?.row === virtualRow.index && editingCell?.col === virtualColumn.index;
                const displayValue = getCellValue(virtualColumn.index, virtualRow.index);

                return (
                  <Cell
                    key={key}
                    row={virtualRow.index}
                    col={virtualColumn.index}
                    width={cellWidth}
                    height={cellHeight}
                    virtualStart={{
                      x: virtualColumn.start,
                      y: virtualRow.start,
                    }}
                    isSelected={isSelected}
                    isEditing={isEditing}
                    displayValue={displayValue}
                    formulaValue={formulaValue}
                    onCellClick={handleCellClick}
                    onCellDoubleClick={handleCellDoubleClick}
                    onCellChange={handleCellChange}
                    finishEditing={finishEditing}
                  />
                );
              })}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default GridArea;
