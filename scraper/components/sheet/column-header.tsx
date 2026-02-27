import type { VirtualItem } from '@tanstack/react-virtual';

import { columnIndexToLetter } from '@/lib/formula-utils';

interface ColumnHeaderProps {
  virtualItems: VirtualItem[];
  totalSize: number;
  headerSize: number;
  cellWidth: number;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  virtualItems,
  totalSize,
  headerSize,
  cellWidth,
}) => {
  return (
    <div
      className="absolute left-0 top-0 z-10"
      style={{
        transform: `translate(${headerSize}px, 0px)`,
        width: `${totalSize}px`,
        height: `${headerSize}px`,
      }}
    >
      <div className="relative h-full">
        {virtualItems.map((virtualColumn) => (
          <div
            key={`col-${virtualColumn.index}`}
            className="sheet-header-cell absolute top-0"
            style={{
              width: `${cellWidth}px`,
              height: `${headerSize}px`,
              transform: `translate(${virtualColumn.start}px, 0px)`,
            }}
          >
            {columnIndexToLetter(virtualColumn.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnHeader;
