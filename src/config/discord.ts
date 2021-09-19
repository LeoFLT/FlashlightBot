import * as dotenv from "dotenv";
dotenv.config({ path: `${__dirname}/../../.env` });

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const OWNER = process.env.OWNER;
export const PREFIX = process.env.PREFIX;