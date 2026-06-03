interface DoseIndicatorProps {
  dose_mg: number;
  className?: string;
}

export function DoseIndicator({ dose_mg, className = '' }: DoseIndicatorProps) {
  const getColor = (dose: number) => {
    switch (dose) {
      case 2.5: return 'bg-green-100 text-green-700 border-green-200';
      case 5: return 'bg-blue-100 text-blue-700 border-blue-200';
      case 7.5: return 'bg-purple-100 text-purple-700 border-purple-200';
      case 10: return 'bg-orange-100 text-orange-700 border-orange-200';
      case 12.5: return 'bg-red-100 text-red-700 border-red-200';
      case 15: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-sm font-bold ${getColor(dose_mg)} ${className}`}>
      {dose_mg} mg
    </div>
  );
}