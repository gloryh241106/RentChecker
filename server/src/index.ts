import { createRuntime } from './bootstrap.js';

const { app, config, logger } = createRuntime(process.env, (line) => process.stdout.write(line));

app.listen(config.port, '0.0.0.0', () => {
  logger.info('listening', { port: config.port });
});
