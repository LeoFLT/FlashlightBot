import chalk from "chalk";
import Logger from "../utils/logger";
import { Flashlight } from "../classes/Flashlight";

export const event: Flashlight.Event =  {
    name: "ready",
    once: true,
    async execute(client: Flashlight.Client) {
        Logger.info(`Logged in as ${chalk.red(client?.user?.tag)}`);
        const args: string[] = ["-nm 0.2","-dt 3", "-ez 3"];
        //const mp = await client.fetchMultiplayer(process.env.TEST_MP_LINK || "", { mapIndex: { midIndex: [1] } });
        //mp.playerList.forEach(p => console.log(`${p.username} (${p.team}) - Cost: ${p.matchCost}`));
        //console.log(chalk.red(`Red: ${mp.teamScores?.red}`) + "\n" + chalk.blue(`Blue: ${mp.teamScores?.blue}`));
    }
};
