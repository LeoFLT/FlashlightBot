import chalk from "chalk";
const DATE_STRING = () => new Date().toISOString().replace("T", " ").replace("Z", "");

export default {
    info(event: string) {
        console.log(`%s    ${event}`, chalk.blue(`${DATE_STRING()} - INFO`));
    },
    error(error: string) {
        console.log(`%s   ${error}`, chalk.red(`${DATE_STRING()} - ERROR`));
    }
}
