import { Printer } from 'lucide-react';

interface PrintButtonProps {
  label?: string;
}

export const PrintButton = ({ label = 'Print Research' }: PrintButtonProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="print-btn-container print-hide inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold text-sm hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all shadow-sm hover:shadow-md"
      title="Print this research as A4 PDF"
    >
      <Printer size={16} />
      {label}
    </button>
  );
};
