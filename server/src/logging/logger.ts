type LogValue = string | number | boolean | readonly string[] | undefined;

export type LogFields = Readonly<Record<string, LogValue>>;

export interface Logger {
  info(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

export type LogSink = (line: string) => void;

// One JSON object per line. Callers pass only fields that are safe to log (NFR-2).
export function createJsonLogger(sink: LogSink): Logger {
  const write = (level: 'info' | 'error', event: string, fields: LogFields = {}): void => {
    sink(`${JSON.stringify({ time: new Date().toISOString(), level, event, ...fields })}\n`);
  };
  return {
    info: (event, fields) => {
      write('info', event, fields);
    },
    error: (event, fields) => {
      write('error', event, fields);
    },
  };
}
