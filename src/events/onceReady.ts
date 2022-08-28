import chalk from "chalk";
import Logger from "../utils/logger";
import { Flashlight } from "../classes/Flashlight";

export const event: Flashlight.Event =  {
    name: "ready",
    once: true,
    async execute(client: Flashlight.Client) {
        Logger.info(`Logged in as ${chalk.red(client?.user?.tag)}`);;
    }
};
