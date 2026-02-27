"use client";
import { useCallback, useRef } from 'react';

import useSheet from '@/hooks/use-sheet';
import { columnIndexToLetter } from '@/lib/formula-utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import SheetToolbar from './sheet-toolbar';
import FormulaBar from './formula-bar';
import ColumnHeader from './column-header';
import RowHeader from './row-header';
import CornerCell from './corner-cell';
import GridArea from './grid-area';



// Constants
const CELL_WIDTH = 100;
const CELL_HEIGHT = 32;
const HEADER_SIZE = 40;
const TOTAL_ROWS = 10000;
const TOTAL_COLUMNS = 10000;

const Sheet: React.FC = () => {
  // Sheet logic from custom hook
  const {
    data,
    selectedCell,
    editingCell,
    formulaValue,
    getCellKey,
    getCellValue,
    handleCellClick,
    handleCellDoubleClick,
    handleCellChange,
    handleFormulaChange,
    finishEditing,
    setSelectedCell,
  } = useSheet();

  // Ref for scrolling
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualized rows
  const rowVirtualizer = useVirtualizer({
    count: TOTAL_ROWS,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CELL_HEIGHT,
    overscan: 5,
  });

  // Virtualized columns
  const columnVirtualizer = useVirtualizer({
    count: TOTAL_COLUMNS,
    horizontal: true,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CELL_WIDTH,
    overscan: 5,
  });

  // Handle keydown events for navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell) return;

      if (editingCell) {
        if (e.key === 'Enter') {
          finishEditing();
          e.preventDefault();
        }
        return;
      }

      let newRow = selectedCell.row;
      let newCol = selectedCell.col;

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, newRow - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(TOTAL_ROWS - 1, newRow + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, newCol - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(TOTAL_COLUMNS - 1, newCol + 1);
          break;
        case 'Enter':
          handleCellDoubleClick(newRow, newCol);
          return;
        default:
          // If user types a character, start editing and prefill with that character
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            handleCellDoubleClick(newRow, newCol);
            setTimeout(() => {
              const input = document.querySelector('input:focus');
              if (input) {
                (input as HTMLInputElement).value = e.key;
                handleCellChange(e.key);
              }
            }, 10);
            return;
          }
          return;
      }

      if (newRow !== selectedCell.row || newCol !== selectedCell.col) {
        setSelectedCell({ row: newRow, col: newCol });

        // Get cell data for the newly selected cell
        // const key = getCellKey(newCol, newRow);
        // const cellData = data.get(key);

        // Scroll to the new cell if needed
        if (parentRef.current) {
          const rowStart = newRow * CELL_HEIGHT;
          const rowEnd = rowStart + CELL_HEIGHT;
          const colStart = newCol * CELL_WIDTH;
          const colEnd = colStart + CELL_WIDTH;
          const scrollTop = parentRef.current.scrollTop;
          const scrollLeft = parentRef.current.scrollLeft;
          const clientHeight = parentRef.current.clientHeight - HEADER_SIZE;
          const clientWidth = parentRef.current.clientWidth - HEADER_SIZE;

          if (rowEnd > scrollTop + clientHeight) {
            parentRef.current.scrollTop = rowEnd - clientHeight;
          } else if (rowStart < scrollTop) {
            parentRef.current.scrollTop = rowStart;
          }

          if (colEnd > scrollLeft + clientWidth) {
            parentRef.current.scrollLeft = colEnd - clientWidth;
          } else if (colStart < scrollLeft) {
            parentRef.current.scrollLeft = colStart;
          }
        }

        e.preventDefault();
      }
    },
    [
      selectedCell,
      editingCell,
      finishEditing,
      handleCellDoubleClick,
      setSelectedCell,
      handleCellChange,
    ]
  );

  const handleCellClickWrapper = (row: number, col: number) => {
    const alreadySelected =
      selectedCell && selectedCell.row === row && selectedCell.col === col;

    if (alreadySelected && !editingCell) {
      handleCellDoubleClick(row, col);
      return;
    }

    handleCellClick(row, col);
  };

  return (
    <div
      className="sheet-container animate-fade-in flex h-full flex-col sheet-excel-theme"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <SheetToolbar />
      <FormulaBar
        value={formulaValue}
        onChange={handleFormulaChange}
        selectedCell={
          selectedCell ? `${columnIndexToLetter(selectedCell.col)}${selectedCell.row + 1}` : ''
        }
      />

      <div
        ref={parentRef}
        className="relative flex-1 min-h-0 overflow-auto bg-white dark:bg-gray-900"
      >
        {/* Column headers */}
        <div className="sticky top-0 z-20">
          <ColumnHeader
            virtualItems={columnVirtualizer.getVirtualItems()}
            totalSize={columnVirtualizer.getTotalSize()}
            headerSize={HEADER_SIZE}
            cellWidth={CELL_WIDTH}
          />
        </div>

        {/* Row headers */}
        <div className="sticky left-0 z-20">
          <RowHeader
            virtualItems={rowVirtualizer.getVirtualItems()}
            totalSize={rowVirtualizer.getTotalSize()}
            headerSize={HEADER_SIZE}
            cellHeight={CELL_HEIGHT}
          />
        </div>

        {/* Corner cell */}
        <div className="sticky left-0 top-0 z-30">
          <CornerCell headerSize={HEADER_SIZE} />
        </div>

        {/* Main grid area */}
        <GridArea
        
          rowVirtualizer={rowVirtualizer}
          columnVirtualizer={columnVirtualizer}
          headerSize={HEADER_SIZE}
          cellWidth={CELL_WIDTH}
          cellHeight={CELL_HEIGHT}
          selectedCell={selectedCell}
          editingCell={editingCell}
          formulaValue={formulaValue}
          getCellKey={getCellKey}
          getCellValue={getCellValue}
          data={data}
          handleCellClick={handleCellClickWrapper}
          handleCellDoubleClick={handleCellDoubleClick}
          handleCellChange={handleCellChange}
          finishEditing={finishEditing}
        />
      </div>
    </div>
  );
};

export default Sheet;
