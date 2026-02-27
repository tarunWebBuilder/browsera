import type { VirtualItem } from '@tanstack/react-virtual';

interface RowHeaderProps {
  virtualItems: VirtualItem[];
  totalSize: number;
  headerSize: number;
  cellHeight: number;
}

const RowHeader: React.FC<RowHeaderProps> = ({
  virtualItems,
  totalSize,
  headerSize,
  cellHeight,
}) => {
  return (
    <div
      className="absolute left-0 top-0 z-10"
      style={{
        transform: `translate(0px, ${headerSize}px)`,
        width: `${headerSize}px`,
        height: `${totalSize}px`,
      }}
    >
      <div className="relative w-full">
        {virtualItems.map((virtualRow) => (
          <div
            key={`row-${virtualRow.index}`}
            className="sheet-header-cell absolute left-0"
            style={{
              height: `${cellHeight}px`,
              width: `${headerSize}px`,
              transform: `translate(0px, ${virtualRow.start}px)`,
            }}
          >
            {virtualRow.index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RowHeader;
