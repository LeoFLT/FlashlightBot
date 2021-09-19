import * as dotenv from "dotenv";
dotenv.config({ path: `${__dirname}/../../.env` });

export default {
    discord: {
        token: process.env.DISCORD_TOKEN,
        owner: process.env.DISCORD_OWNER,
        prefix: process.env.DISCORD_PREFIX
    },
    osu: {
        clientId: parseInt(process.env.OSU_CLIENT_ID || ""),
        clientSecret: process.env.OSU_CLIENT_SECRET
    }
}
