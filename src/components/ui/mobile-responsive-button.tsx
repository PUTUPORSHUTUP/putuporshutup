import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface MobileResponsiveButtonProps extends React.ComponentProps<typeof Button> {
  mobileSize?: 'default' | 'sm' | 'lg' | 'icon';
  desktopSize?: 'default' | 'sm' | 'lg' | 'icon';
  hideTextOnMobile?: boolean;
  mobileIcon?: React.ReactNode;
}

export const MobileResponsiveButton = forwardRef<
  React.ElementRef<typeof Button>,
  MobileResponsiveButtonProps
>(({ 
  children, 
  className, 
  mobileSize = 'sm', 
  desktopSize = 'default',
  hideTextOnMobile = false,
  mobileIcon,
  size,
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  
  const effectiveSize = isMobile ? mobileSize : desktopSize;
  const actualSize = size || effectiveSize;
  
  return (
    <Button
      ref={ref}
      size={actualSize}
      className={cn(className)}
      {...props}
    >
      {isMobile && hideTextOnMobile && mobileIcon ? (
        mobileIcon
      ) : (
        children
      )}
    </Button>
  );
});

MobileResponsiveButton.displayName = 'MobileResponsiveButton';