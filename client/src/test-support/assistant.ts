import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { renderApp } from './render-app.js';

export const PROMPT =
  'My landlord kept 12,000 for painting and 3,000 service fee. Deposit was 30,000, rent 15,000 a month, I moved out on 15 June 2026.';

export const panel = () =>
  within(screen.getByRole('region', { name: 'Tell the assistant what you need' }));
export const rows = () => panel().getAllByRole('listitem');
export const press = (user: UserEvent, name: string) =>
  user.click(screen.getByRole('button', { name }));
export const status = () => screen.getByRole('status').textContent;

export async function type(user: UserEvent, prompt: string): Promise<void> {
  await user.clear(screen.getByLabelText('Your message'));
  await user.click(screen.getByLabelText('Your message'));
  await user.paste(prompt);
  await press(user, 'Read my message');
}

export async function send(prompt: string, options: Parameters<typeof renderApp>[0] = {}) {
  const view = renderApp(options);
  await type(view.user, prompt);
  await press(view.user, 'Continue');
  return view;
}

export async function answer(user: UserEvent, label: string, text: string): Promise<void> {
  await user.type(screen.getByLabelText(label), text);
  await press(user, 'Answer');
}
