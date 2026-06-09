export function LoadingSpinner({ size = 'md', color }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const topColor = color === 'white' ? '#ffffff' : color ?? '#ff6500';
  const trackColor = color === 'white' ? 'rgba(255,255,255,0.3)' : 'var(--color-surface-border)';

  return (
    <div className="flex justify-center items-center p-4">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]}`}
        style={{ borderColor: trackColor, borderTopColor: topColor }}
      />
    </div>
  );
}
