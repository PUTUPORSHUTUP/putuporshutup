import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Animated Card Component
interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  animationDelay?: number;
  hoverEffect?: boolean;
}

export const AnimatedCard = forwardRef<
  React.ElementRef<typeof Card>,
  AnimatedCardProps
>(({ className, animationDelay = 0, hoverEffect = true, ...props }, ref) => {
  const delayClass = animationDelay > 0 ? `animate-fade-in-delay-${animationDelay}` : 'animate-fade-in-up';
  const hoverClass = hoverEffect ? 'hover:scale-105 hover:-translate-y-1' : '';
  
  return (
    <Card
      ref={ref}
      className={cn(
        delayClass,
        hoverClass,
        'transition-all duration-300 ease-out cursor-pointer group',
        className
      )}
      {...props}
    />
  );
});

AnimatedCard.displayName = 'AnimatedCard';

// Animated Button Component
interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  animationType?: 'scale' | 'glow' | 'wobble' | 'bounce';
  glowColor?: string;
}

export const AnimatedButton = forwardRef<
  React.ElementRef<typeof Button>,
  AnimatedButtonProps
>(({ className, animationType = 'scale', glowColor, children, ...props }, ref) => {
  const getAnimationClass = () => {
    switch (animationType) {
      case 'glow':
        return 'hover:animate-glow-pulse hover:shadow-glow-primary';
      case 'wobble':
        return 'hover:animate-wobble';
      case 'bounce':
        return 'hover:animate-gentle-bounce';
      case 'scale':
      default:
        return 'hover:scale-105 active:scale-95';
    }
  };

  return (
    <Button
      ref={ref}
      className={cn(
        'transition-all duration-200 ease-out',
        getAnimationClass(),
        glowColor && `hover:shadow-[0_0_20px_${glowColor}]`,
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

// Animated List Item
interface AnimatedListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: number;
  staggerDelay?: number;
}

export const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ className, index = 0, staggerDelay = 100, children, ...props }, ref) => {
    const delay = index * staggerDelay;
    const animationClass = delay <= 300 ? `animate-fade-in-delay-${delay}` : 'animate-fade-in-left';
    
    return (
      <div
        ref={ref}
        className={cn(
          animationClass,
          'transition-all duration-300 hover:translate-x-2',
          className
        )}
        style={{ animationDelay: delay > 300 ? `${delay}ms` : undefined }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AnimatedListItem.displayName = 'AnimatedListItem';

// Stagger Container for animating children
interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ className, staggerDelay = 100, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * staggerDelay}ms` }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }
);

StaggerContainer.displayName = 'StaggerContainer';

// Animated Icon with hover effects
interface AnimatedIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  effect?: 'spin' | 'bounce' | 'pulse' | 'wobble';
  triggerOnHover?: boolean;
}

export const AnimatedIcon = forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ className, icon, size = 'md', effect = 'bounce', triggerOnHover = true, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6', 
      lg: 'w-8 h-8'
    };

    const effectClasses = {
      spin: 'animate-spin',
      bounce: 'animate-gentle-bounce',
      pulse: 'animate-pulse',
      wobble: 'animate-wobble'
    };

    const hoverClass = triggerOnHover ? `hover:${effectClasses[effect]}` : effectClasses[effect];

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          sizeClasses[size],
          'transition-all duration-200',
          hoverClass,
          className
        )}
        {...props}
      >
        {icon}
      </div>
    );
  }
);

AnimatedIcon.displayName = 'AnimatedIcon';

// Loading States with better animations
export const AnimatedLoader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-center space-x-2', className)} {...props}>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
  </div>
);

// Animated Number Counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  duration = 1000, 
  className 
}) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span className={className}>{count.toLocaleString()}</span>;
};