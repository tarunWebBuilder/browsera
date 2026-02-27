interface CornerCellProps {
  headerSize: number;
}

const CornerCell: React.FC<CornerCellProps> = ({ headerSize }) => {
  return (
    <div
      className="sheet-header-cell absolute left-0 top-0 z-20 bg-white/90 shadow-sm backdrop-blur-sm dark:bg-gray-900/90"
      style={{
        width: `${headerSize}px`,
        height: `${headerSize}px`,
      }}
    />
  );
};

export default CornerCell;