/**
 * ConsentToggle — an accessible toggle switch (role="switch") using CSS only.
 *
 * Props:
 *   id          (string)   — used for label association
 *   label       (string)   — visible label text
 *   description (string)   — explanatory text below label
 *   checked     (bool)     — current state
 *   onChange    (function) — called with new boolean value
 *
 * Accessibility:
 *   - role="switch" on the button (correct ARIA pattern for toggles)
 *   - aria-checked reflects current state
 *   - label element's htmlFor points to the button id
 *   - Space or Enter toggles (native button behaviour)
 *   - Visible focus ring
 */

export default function ConsentToggle({ id, label, description, checked, onChange }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Label — points to the button via htmlFor */}
        <label
          htmlFor={id}
          className="text-sm font-medium text-neutral-800 cursor-pointer select-none"
        >
          {label}
        </label>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          id={id}
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={[
            'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
            checked
              ? 'bg-primary-600'
              : 'bg-neutral-300',
          ].join(' ')}
        >
          {/* Screen-reader label for current state */}
          <span className="sr-only">{checked ? 'Enabled' : 'Disabled'}</span>

          {/* Sliding thumb */}
          <span
            aria-hidden="true"
            className={[
              'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Description */}
      {description && (
        <p className="mt-1 text-sm text-neutral-500 pr-14">
          {description}
        </p>
      )}
    </div>
  );
}
