import chalk from "chalk";

const PREFIX = "[laravel-vite-translations]";

export const logger = {
  info(message: string): void {
    console.log(`${chalk.cyan(PREFIX)} ${message}`);
  },

  success(message: string): void {
    console.log(`${chalk.green(PREFIX)} ${message}`);
  },

  warn(message: string): void {
    console.warn(`${chalk.yellow(PREFIX)} ${message}`);
  },

  error(message: string): void {
    console.error(`${chalk.red(PREFIX)} ${message}`);
  },

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(`${chalk.gray(PREFIX)} ${message}`);
    }
  },
};
