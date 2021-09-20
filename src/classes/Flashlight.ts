import config from "../config/envVars";
import { Match, Type as EventType, Mod as GameMod } from "../definitions/Match";
import { median } from "../utils/math";
import fetch from "node-fetch";
import {
    Client as DiscordClient,
    ClientOptions as DiscordOptions,
    Collection as DiscordCollection,
} from "discord.js";
export interface Command {
    name: string;
    aliases: string[];
    hasArgs: boolean;
    description: string;
    usage?: string;
    example?: string;
    execute(client: Flashlight, args?: string[], ...events: any[]): void;
};

export interface Event {
    name: string;
    once: boolean;
    execute(client: Flashlight, ...events: any[]): void;
};

export type FlashlightMod = {
    [key in GameMod as string]?: number;
}

export class Flashlight extends DiscordClient {
    commands: DiscordCollection<string | undefined, Command>;
    osu: {
        tokenInfo: {
            token_type: "Bearer" | undefined
            expires_in: number | undefined,
            expires_at: Date | undefined,
            access_token: string | undefined
        }
    };

    constructor(options: DiscordOptions) {
        super(options);
        this.commands = new DiscordCollection();
        this.osu = {
            tokenInfo: {
                token_type: undefined,
                expires_in: undefined,
                expires_at: undefined,
                access_token: undefined,
            },
        };
    }

    private get _osuTokenIsValid(): boolean {
        if (!this.osu.tokenInfo.expires_at || !this.osu.tokenInfo.access_token)
            return false;
        // token is almost certainly invalid by now (or it will be in the next 10 seconds)
        return (Math.abs(Date.now() - this.osu.tokenInfo.expires_at.getTime()) > 10000);
    }
 
    private async _osuRequest(endpoint: string) {
        const headers = {
            "Authorization": `Bearer ${this.osu.tokenInfo.access_token}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
        const req = await fetch(`https://osu.ppy.sh/api/v2/${endpoint}`, {
            method: "GET",
            headers: headers
        });
        return req;
    }

    async requestToken(): Promise<void> {
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };
        const body = {
            grant_type: "client_credentials",
            client_id: config.osu.clientId,
            client_secret: config.osu.clientSecret,
            scope: "public"
        };
        const req = await fetch("https://osu.ppy.sh/oauth/token", {
            method: "post",
            headers: headers,
            body: JSON.stringify(body)
        });
        const res = await req.json();
        this.osu.tokenInfo = res;
        this.osu.tokenInfo.expires_at = new Date (Date.now() + (res.expires_in * 1000));
    }

    async fetchMultiplayer(lobby: string, multipliers?: FlashlightMod): Promise<Object> {
        let eventIdCursor = 0;
        const modEnum: FlashlightMod = {
            'NM': 1, 'NF': 1, 'EZ': 1,
            'HD': 1 , 'HR': 1,'SD': 1, 
            'DT': 1 , 'RX': 1, 'HT': 1,
            'NC': 1, 'FL': 1,'SO': 1, 'PF': 1
        };
        let lobbyPlayerMapCounts: number[] = [];
        if (multipliers) {
            for (const mod in multipliers) {
                if (modEnum.hasOwnProperty(mod)) {
                    console.log(mod, multipliers[mod]);
                    let newMultiplier = multipliers[mod];
                    if (typeof newMultiplier === "number") {
                        if (newMultiplier > 10) newMultiplier = 10;
                        else if (newMultiplier <= 0) newMultiplier = 0;
                        modEnum[mod] = newMultiplier;
                    }
                }
            }
        }

        if (!this._osuTokenIsValid)
            await this.requestToken();
        
        const lobbyIdMatch = lobby.match(/(?:https:\/\/osu\.ppy\.sh\/(?:community\/matches\/|mp\/))?(\d{3,15})\/?/);

        if (!Array.isArray(lobbyIdMatch))
        throw new Error ("Invalid osu! lobby identifier");
        
        const lobbyId = lobbyIdMatch[1];
        const req = await this._osuRequest(`matches/${lobbyId}`);
        
        if (!req.ok)
            throw new Error ("invalid osu! lobby identifier");
        
        const res: Match = await req.json();
        const playerListMap = new Map ();

        if (res.events[0].detail.type !== EventType.MatchCreated) {
            // we're missing data, query again
            console.log(`Current cursor id: ${eventIdCursor}`);
            if (eventIdCursor === 0) {
                /* First time using the cursor to find missing data,
                setting the first known event as the current cursor.
                This approach should (hopefully) minimize errors */
                eventIdCursor = res.events[0].id;
            } else if (eventIdCursor === res.events[0].id) {
                // nothing changed, no way to recover
                throw new Error (`Error while making consecutive API calls: the first known event ID is not of type "${EventType.MatchCreated}"`)
            }
            const newReq = await this._osuRequest(`matches/${lobbyId}?before=${res.events[0].id}`);
            if (!req.ok)
                throw new Error (`Error while querying successive osu! lobbies (Event Id: ${res.events[0].id})`);
            const newRes: Match = await newReq.json();
            res.events.unshift(...newRes.events);            
        }
        for (const player of res.users) {
            player.mapAmount = 0;
            player.matchCost = 0;
            player.scores = [];
            playerListMap.set(player.id, player);
        }
      
        const mpLobby = {
            playerList: playerListMap,
            teamType: "",
            gameList: new Map (),
            teamScores: { "red": 0, "blue": 0 },
            medianLobby: 0,
            gameMode: {
                osu: false,
                taiko: false,
                mania: false,
                fruits: false,
                get gameModeList() {
                    let gameModeList = [];
                    for (const prop in this) {
                        if (this.hasOwnProperty(prop)) {
                            // @ts-ignore
                            if (this[prop] === true)
                                gameModeList.push(prop);
                        }
                    }
                    return gameModeList;
                },
                get isMultipleGameModes() {
                    return this.gameModeList.length > 1;
                }
            }
        };

        for (const event in res.events) {
            if (res.events[event]?.detail.type === "other") {
                if (res.events[event]?.game) {
                    let redScore = 0;
                    let blueScore = 0;
                    const game = res.events[event].game;
                    if (!game) continue;
                    mpLobby.gameMode[game.mode] = true;
                    mpLobby.teamType = game.team_type;
                    const scores = [];

                    for (const score of game.scores) {
                        const player = mpLobby.playerList.get(score.user_id);

                        if (score.score > 1000) {
                            if (typeof modEnum.NM === "number")
                                score.score *= modEnum.NM;
                                
                            if (score.match.team === "red")
                                redScore += score.score;                               

                            if (score.match.team === "blue")
                                blueScore += score.score;

                            if (score.mods.length > 0) {
                                for (const mod of score.mods) {
                                    const currMod = modEnum[mod];
                                    if (currMod) {
                                        score.score *= currMod;
                                    }
                                }
                            }
                            scores.push(score.score);
                            player.scores.push({ id: game.id, score: score.score });
                            player.mapAmount++;
                        }
                    }
                    mpLobby.gameList.set(game.id, { medianScore: median(scores) });
                    if (redScore > blueScore)
                        mpLobby.teamScores.red++;
                    
                    if (blueScore > redScore)
                        mpLobby.teamScores.blue++;
                }
            }
        }
        
        mpLobby.playerList.forEach(V => {
            if (V?.mapAmount > 0)
                lobbyPlayerMapCounts.push(V?.mapAmount);
        });
        
        mpLobby.medianLobby = median(lobbyPlayerMapCounts);
        mpLobby.playerList.forEach(player => {
            let scoreSum = 0;
            for (const score of player.scores) {
                scoreSum += (score.score / mpLobby.gameList.get(score.id).medianScore);
            }
            scoreSum /= player.mapAmount;
            if (scoreSum)
                player.matchCost = scoreSum * (player.mapAmount / mpLobby.medianLobby) ** (1 / 3);
        });
        return mpLobby;
    }
    
    addCommand(K: string, V: Command) {
        this.commands.set(K, V);
        return this.commands;
    }

    addEvent(once: boolean, event: string, callback: Function): void {
        if (once)
            this.once(event, (...args) => callback(...args));
        else
            this.on(event, (...args) => callback(...args));
    }
}
