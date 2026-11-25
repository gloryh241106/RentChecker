import { createRuntime } from '../server/src/bootstrap.js';

// Vercel runs this app as one function. It never calls listen.
export default createRuntime(process.env, (line) => process.stdout.write(line)).app;
