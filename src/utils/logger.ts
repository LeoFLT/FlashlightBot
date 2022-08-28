import chalk from "chalk";
const DATE_STRING = () => new Date().toISOString().replace("T", " ").replace("Z", "");

export default {
    info(event: string) {
        return console.log(`%s    ${event}`, chalk.blue(`${DATE_STRING()} - INFO`));
    },
    error(error: Error | any) {
        if (!error?.message)
            return console.log(`%s   ${error}`, chalk.red(`${DATE_STRING()} - ERROR`));

        if (error?.stack)
            return console.log(`%s   \n${error.stack}`, chalk.red(`${DATE_STRING()} - ERROR`));
        
        return console.log(`%s   ${error.message}`, chalk.red(`${DATE_STRING()} - ERROR`));
    }
}
