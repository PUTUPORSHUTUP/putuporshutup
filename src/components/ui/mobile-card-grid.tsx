import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileCardGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export const MobileCardGrid = ({ 
  children, 
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}: MobileCardGridProps) => {
  const isMobile = useIsMobile();
  
  const gridClasses = cn(
    'grid gap-4 sm:gap-6',
    `grid-cols-${cols.mobile}`,
    `md:grid-cols-${cols.tablet}`,
    `lg:grid-cols-${cols.desktop}`,
    className
  );
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};