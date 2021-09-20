import chalk from "chalk";
import Logger from "../utils/logger";
import { Event } from "../classes/Flashlight";

export const event: Event =  {
    name: "ready",
    once: true,
    async execute(client) {
        Logger.info(`Logged in as ${chalk.red(client?.user?.tag)}`);
        const res = await client.fetchMultiplayer(process.env.TEST_MP_LINK || "")//, { "NM": 0.1, "NF": 1.2, "EZ": 2 });
        // @ts-ignore
        res.playerList.forEach(player => console.log(`${player.username}: ${player.matchCost}`));
    }
};
