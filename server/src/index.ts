import { createRuntime } from './bootstrap.js';

const { app, port, logger } = createRuntime(process.env, (line) => process.stdout.write(line));

app.listen(port, '0.0.0.0', () => {
  logger.info('listening', { port });
});
