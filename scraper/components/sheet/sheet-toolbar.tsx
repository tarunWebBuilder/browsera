"use client";

const SheetToolbar: React.FC = () => {
  return (
    <div className="sheet-toolbar animate-float-in justify-between text-slate-900">
      <div className="mr-4">
        <h1 className="text-lg font-medium">Spreadsheet</h1>
        <p className="text-xs text-slate-600">Excel-light theme enforced</p>
      </div>
    </div>
  );
};

export default SheetToolbar;
