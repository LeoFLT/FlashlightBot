import chalk from "chalk";
import Logger from "../utils/logger";
import { Event } from "../classes/Flashlight";

export const event: Event =  {
    name: "ready",
    once: true,
    async execute(client) {
        Logger.info(`Logged in as ${chalk.red(client?.user?.tag)}`);
        console.log(await client.fetchMultiplayer(process.env.TEST_MP_LINK || ""));
    }
};