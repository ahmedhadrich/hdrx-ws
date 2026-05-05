import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

export function Eyebrow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('eyebrow', className)} {...props}>
      {children}
    </span>
  );
}
