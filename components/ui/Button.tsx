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
  'inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium tracking-tight transition duration-300 ease-out-soft will-change-transform select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-ink-primary text-bg-base hover:-translate-y-px hover:shadow-lift focus-visible:shadow-glow-signal active:translate-y-0',
  ghost:
    'border border-rule text-ink-primary hover:bg-bg-raised hover:-translate-y-px focus-visible:shadow-glow-signal',
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
