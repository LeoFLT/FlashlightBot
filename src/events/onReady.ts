import { ActivityType } from "discord.js";
import { Flashlight } from "../classes/Flashlight";
import config from "../config/envVars";

export const event: Flashlight.Event =  {
    name: "ready",
    once: false,
    async execute(client: Flashlight.Client) {
        return client.user?.setActivity(`for /help | ${client.guilds.cache.size} guilds`, { type: ActivityType.Watching });
    }
};
