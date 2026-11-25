import type { FocusEvent, HTMLAttributes, ReactNode } from 'react';
import { AlertIcon } from './Icon.js';

/** What every field shows around its control (UI.md Accessibility). */
export interface FieldFrameProps {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string | undefined;
  /** Adds "(required)" to the label text. */
  readonly isRequired?: boolean;
}

interface ControlLinks {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': true | undefined;
}

/** The hint and the error are tied to the control, and the error marks it invalid. */
export function controlLinks({ id, hint, error }: FieldFrameProps): ControlLinks {
  const ids = [
    hint === undefined ? null : `${id}-hint`,
    error === undefined ? null : `${id}-error`,
  ];
  const linked = ids.filter((each) => each !== null);
  return {
    id,
    'aria-describedby': linked.length === 0 ? undefined : linked.join(' '),
    'aria-invalid': error === undefined ? undefined : true,
  };
}

export const CONTROL_CLASS =
  'block min-h-11 w-full rounded-md border-2 border-line-input bg-raised px-3 py-2 text-base text-ink';

export function controlClass(error: string | undefined): string {
  return `${CONTROL_CLASS} ${error === undefined ? '' : 'border-danger'}`;
}

interface FrameProps extends FieldFrameProps {
  readonly children: ReactNode;
}

export function FieldFrame({ children, ...field }: FrameProps) {
  const { id, label, hint, error, isRequired = false } = field;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-semibold">
        {isRequired ? `${label} (required)` : label}
      </label>
      {hint === undefined ? null : (
        <p id={`${id}-hint`} className="text-ink-muted">
          {hint}
        </p>
      )}
      {children}
      {error === undefined ? null : <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

function FieldError({ id, message }: { readonly id: string; readonly message: string }) {
  return (
    <p id={id} className="flex gap-2 font-medium text-danger">
      <AlertIcon className="mt-0.5 size-5 shrink-0" />
      <span>
        <span className="sr-only">Error: </span>
        {message}
      </span>
    </p>
  );
}

interface TextFieldProps extends FieldFrameProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: () => void;
  readonly inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  readonly isMultiline?: boolean;
  readonly rows?: number;
}

/**
 * Leaving for anything else says nothing yet. A message that appears between the press and the
 * release of a pointer moves the button below it, and the click is lost.
 */
function isTypingField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.matches('input:not([type="checkbox"]), select, textarea')
  );
}

/** A private value, so the browser is told not to remember it (UI.md). */
export function TextField(props: TextFieldProps) {
  const { value, onChange, onBlur, inputMode, isMultiline = false, rows = 8 } = props;
  const shared = {
    ...controlLinks(props),
    className: controlClass(props.error),
    value,
    autoComplete: 'off',
    onBlur: (event: FocusEvent) => {
      if (isTypingField(event.relatedTarget)) {
        onBlur?.();
      }
    },
  };
  return (
    <FieldFrame {...props}>
      {isMultiline ? (
        <textarea {...shared} rows={rows} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input
          {...shared}
          type="text"
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FieldFrame>
  );
}

interface SelectFieldProps extends FieldFrameProps {
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}

export function SelectField(props: SelectFieldProps) {
  return (
    <FieldFrame {...props}>
      <select
        {...controlLinks(props)}
        className={controlClass(props.error)}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

interface CheckboxFieldProps {
  readonly id: string;
  readonly label: string;
  readonly isChecked: boolean;
  readonly onChange: (isChecked: boolean) => void;
}

export function CheckboxField({ id, label, isChecked, onChange }: CheckboxFieldProps) {
  return (
    <div className="flex min-h-11 items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={isChecked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-2 size-6 shrink-0 accent-primary"
      />
      <label htmlFor={id} className="py-2">
        {label}
      </label>
    </div>
  );
}
