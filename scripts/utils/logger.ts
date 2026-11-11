/**
 * Logger for script validators. Colored output when stdout is a TTY.
 * Never logs to stderr unless severity is error.
 */

const isTty = typeof process !== 'undefined' && process.stdout.isTTY === true;

const COLORS = {
  reset: isTty ? '\x1b[0m' : '',
  red: isTty ? '\x1b[31m' : '',
  yellow: isTty ? '\x1b[33m' : '',
  green: isTty ? '\x1b[32m' : '',
  cyan: isTty ? '\x1b[36m' : '',
  gray: isTty ? '\x1b[90m' : '',
  bold: isTty ? '\x1b[1m' : '',
};

export interface LoggerOptions {
  /** Prefix shown before every line, e.g. "[seo]". */
  prefix?: string;
}

class Logger {
  private prefix: string;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix ?? '';
  }

  private write(line: string): void {
    const prefix = this.prefix ? `${COLORS.gray}${this.prefix}${COLORS.reset} ` : '';
    process.stdout.write(`${prefix}${line}\n`);
  }

  private writeErr(line: string): void {
    const prefix = this.prefix ? `${COLORS.gray}${this.prefix}${COLORS.reset} ` : '';
    process.stderr.write(`${prefix}${line}\n`);
  }

  info(message: string): void {
    this.write(`${COLORS.cyan}i${COLORS.reset} ${message}`);
  }

  success(message: string): void {
    this.write(`${COLORS.green}+${COLORS.reset} ${message}`);
  }

  warn(message: string): void {
    this.write(`${COLORS.yellow}!${COLORS.reset} ${message}`);
  }

  error(message: string): void {
    this.writeErr(`${COLORS.red}x${COLORS.reset} ${message}`);
  }

  debug(message: string): void {
    if (process.env.DEBUG !== '1') return;
    this.write(`${COLORS.gray}. ${message}${COLORS.reset}`);
  }

  heading(message: string): void {
    this.write(`${COLORS.bold}${message}${COLORS.reset}`);
  }

  child(prefix: string): Logger {
    return new Logger({ prefix: `${this.prefix}/${prefix}` });
  }
}

export const logger = new Logger();

export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}
