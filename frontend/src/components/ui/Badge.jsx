/**
 * Small label pill for status indicators and category tags.
 * Variants: success | warning | info | neutral | error
 * Never relies on colour alone — the text label is always present.
 */

const VARIANT_CLASSES = {
  success: 'bg-success-50 text-success-700 border border-success-200',
  warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  info:    'bg-primary-50 text-primary-700 border border-primary-200',
  neutral: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
  error:   'bg-error-50 text-error-700 border border-error-200',
};

export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
