// Parse a cell reference like "A1" to row and column indices
const parseCellReference = (ref: string): { col: number; row: number } | null => {
  const match = ref.match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;

  const colStr = match[1];
  const rowStr = match[2];

  // Convert column letters to number (A=0, B=1, etc.)
  let colNum = 0;
  for (let i = 0; i < colStr.length; i++) {
    colNum = colNum * 26 + (colStr.charCodeAt(i) - 64);
  }

  return {
    col: colNum - 1, // 0-based index
    row: parseInt(rowStr) - 1, // 0-based index
  };
};

// Convert column index to letter (0=A, 1=B, etc.)
export const columnIndexToLetter = (index: number): string => {
  let result = '';
  let temp = index + 1;

  while (temp > 0) {
    const remainder = (temp - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    temp = Math.floor((temp - 1) / 26);
  }

  return result;
};

// Evaluate a basic formula like "A1+B1"
export const evaluateFormula = (
  formula: string,
  getCellValue: (col: number, row: number) => string
): string => {
  // Check if it's a formula (starts with =)
  if (!formula.startsWith('=')) return formula;

  const expression = formula.substring(1);

  // Replace cell references with their values
  const evaluatedExpression = expression.replace(/[A-Z]+[0-9]+/g, (cellRef) => {
    const cell = parseCellReference(cellRef);
    if (!cell) return '0';

    const value = getCellValue(cell.col, cell.row);
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '0' : numValue.toString();
  });

  try {
    // Use Function constructor to evaluate the expression

    return new Function(`return ${evaluatedExpression}`)().toString();
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return '#ERROR';
  }
};