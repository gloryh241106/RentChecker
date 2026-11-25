// The one definition of the Content Security Policy for Express (Helmet).
// vercel.json repeats it for client files on Vercel, and csp.test.ts checks the two are equal.
// No inline script and no host but our own (BACKEND.md).
export const CSP_DIRECTIVES: Readonly<Record<string, string[]>> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};
