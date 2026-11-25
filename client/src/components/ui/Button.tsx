import type { ComponentProps, ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router';

type Variant = 'primary' | 'secondary' | 'danger' | 'quiet';

const BASE =
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-4 py-2 text-center text-base font-semibold no-underline disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Readonly<Record<Variant, string>> = {
  primary: 'border-primary bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border-primary bg-raised text-primary hover:bg-sunken',
  danger: 'border-danger bg-danger text-on-primary hover:bg-ink',
  quiet: 'border-transparent bg-transparent text-primary underline hover:bg-sunken',
};

function classOf(variant: Variant, isFullWidth: boolean): string {
  return `${BASE} ${VARIANTS[variant]} ${isFullWidth ? 'w-full sm:w-auto' : ''}`;
}

interface Appearance {
  readonly variant?: Variant;
  /** Full width on a phone (UI.md). */
  readonly isFullWidth?: boolean;
}

type ButtonProps = Appearance & Omit<ComponentProps<'button'>, 'className'>;
type ButtonLinkProps = Appearance & Omit<ComponentPropsWithoutRef<typeof Link>, 'className'>;

export function Button({
  variant = 'primary',
  isFullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={classOf(variant, isFullWidth)} {...props} />;
}

export function ButtonLink({
  variant = 'secondary',
  isFullWidth = false,
  ...props
}: ButtonLinkProps) {
  return <Link className={classOf(variant, isFullWidth)} {...props} />;
}
