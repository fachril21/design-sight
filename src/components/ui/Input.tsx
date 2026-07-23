import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={[
          'w-full min-h-[44px] px-4 py-2 rounded-arcade',
          'bg-arcade-bg text-arcade-text placeholder:text-arcade-muted',
          'border-3 border-arcade-border focus:border-arcade-primary',
          className,
        ].join(' ')}
        {...rest}
      />
    );
  },
);
