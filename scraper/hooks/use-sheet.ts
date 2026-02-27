import { useCallback, useRef, useState } from 'react';

import { evaluateFormula } from '@/lib/formula-utils';

interface CellData {
  value: string;
  formula: string;
}

interface CellPosition {
  row: number;
  col: number;
}

const useSheet = () => {
  // State for cell data, selected cell, and edit state
  const [data, setData] = useState<Map<string, CellData>>(new Map());
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [formulaValue, setFormulaValue] = useState<string>('');

  // Ref for cell input
  const cellInputRef = useRef<HTMLInputElement | null>(null);

  // Get the cell key from row and column
  const getCellKey = useCallback((col: number, row: number): string => {
    return `${col},${row}`;
  }, []);

  // Get cell value by coordinates
  const getCellValue = useCallback(
    (col: number, row: number): string => {
      const key = getCellKey(col, row);
      const cell = data.get(key);

      if (!cell) return '';

      // If the cell has a formula, evaluate it
      if (cell.formula.startsWith('=')) {
        return evaluateFormula(cell.formula, getCellValue);
      }

      return cell.value;
    },
    [data, getCellKey]
  );

  // Handle cell selection
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      setSelectedCell({ row, col });
      const key = getCellKey(col, row);
      const cellData = data.get(key);
      setFormulaValue(cellData?.formula || '');
    },
    [getCellKey, data]
  );

  // Handle cell double click to start editing
  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      setEditingCell({ row, col });
      setSelectedCell({ row, col });

      const key = getCellKey(col, row);
      const cellData = data.get(key);
      setFormulaValue(cellData?.formula || '');

      // Focus on the input after a short delay to ensure it's mounted
      setTimeout(() => {
        if (cellInputRef.current) {
          cellInputRef.current.focus();
          cellInputRef.current.select();
        }
      }, 10);
    },
    [getCellKey, data]
  );

  // Handle cell value change
  const handleCellChange = useCallback(
    (value: string) => {
      if (!editingCell) return;

      const key = getCellKey(editingCell.col, editingCell.row);
      const newData = new Map(data);

      newData.set(key, {
        value: value.startsWith('=') ? evaluateFormula(value, getCellValue) : value,
        formula: value,
      });

      setData(newData);
      setFormulaValue(value);
    },
    [editingCell, getCellKey, data, getCellValue]
  );

  // Handle formula bar change
  const handleFormulaChange = useCallback(
    (value: string) => {
      setFormulaValue(value);

      if (selectedCell) {
        const key = getCellKey(selectedCell.col, selectedCell.row);
        const newData = new Map(data);

        newData.set(key, {
          value: value.startsWith('=') ? evaluateFormula(value, getCellValue) : value,
          formula: value,
        });

        setData(newData);
      }
    },
    [selectedCell, getCellKey, data, getCellValue]
  );

  // Finish editing when pressing Enter or clicking away
  const finishEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  return {
    data,
    selectedCell,
    editingCell,
    formulaValue,
    cellInputRef,
    getCellKey,
    getCellValue,
    handleCellClick,
    handleCellDoubleClick,
    handleCellChange,
    handleFormulaChange,
    finishEditing,
    setSelectedCell,
  };
};

export default useSheet;