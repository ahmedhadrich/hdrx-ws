'use client';

import { cn } from '@/lib/utils/cn';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

type Variant = 'primary' | 'ghost';

interface BaseProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const base =
  'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-tight transition-all duration-300 ease-out-soft will-change-transform select-none hover:-translate-y-px active:translate-y-0 backdrop-blur-xl saturate-150';

const variants: Record<Variant, string> = {
  primary:
    'nav-pill text-ink-primary focus-visible:shadow-glow-signal',
  ghost:
    'nav-pill text-ink-primary focus-visible:shadow-glow-signal',
};

type AnchorProps = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string;
  };

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, AnchorProps | ButtonProps>(
  ({ variant = 'primary', className, children, ...props }, ref) => {
    if ('href' in props && props.href) {
      const { href, ...rest } = props as AnchorProps;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(base, variants[variant], className)}
          {...rest}
        >
          {children}
          <Arrow />
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(base, variants[variant], className)}
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
        <Arrow />
      </button>
    );
  }
);
Button.displayName = 'Button';

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-300 ease-out-soft group-hover:translate-x-1"
    >
      <path d="M3 7h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
