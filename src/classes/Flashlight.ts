import {
    Client as DiscordClient,
    ClientOptions as DiscordOptions,
    Collection as DiscordCollection,
} from "discord.js";
import fetch from "node-fetch";
import { Match, Game, Type as EventType } from "../definitions/Match";

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
            client_id: parseInt(process.env.OSU_CLIENT_ID || ""),
            client_secret: process.env.OSU_CLIENT_SECRET,
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

    // TODO: implement custom multiplier support for any mod combination
    async fetchMultiplayer(lobby: string): Promise<Object> {
        if (!this._osuTokenIsValid)
            await this.requestToken();
        const lobbyIdMatch = lobby.match(/(?:https:\/\/osu\.ppy\.sh\/(?:community\/matches\/|mp\/))?(\d{3,15})\/?/);
        if (!Array.isArray(lobbyIdMatch))
            throw new Error ("Invalid osu! lobby identifier");
        const lobbyId = lobbyIdMatch[1];
        const req = await this._osuRequest(`matches/${lobbyId}`);
        if (!req.ok)
            throw new Error ("invalid osu! lobby identifier");
        const res = await req.json();
        const playerListMap = new Map();
        for (const player of res.users) {
            player.scoreSum = 0;
            player.mapAmount = 0;
            playerListMap.set(player.id, player);
        }
        const mpLobby = {
            playerList: playerListMap,
            teamType: undefined,
            gameList: [],
            gameMode: {
                osu: false,
                taiko: false,
                mania: false,
                fruits: false,
                get isMultipleGameModes() {
                    let gameModeAmount = 0;
                    for (const prop in this) {
                        if (this.hasOwnProperty(prop)) {
                            // @ts-ignore
                            if ( this[prop] === true)
                                gameModeAmount++;
                        }
                    }
                    return gameModeAmount > 1;
                }
            }
        };

        for (const event in res.events) {
            if (res.events[event]?.detail.type === "other") {
                if (res.events[event]?.game) {
                    const game: Game = res.events[event].game;
                    mpLobby.gameMode[game.mode] = true;
                    mpLobby.teamType = res.events[event].game.team_type;
                    for (const score of game.scores) {
                        const player = mpLobby.playerList.get(score.user_id);
                        player.scoreSum += score.score;
                        player.mapAmount++;
                    }
                }
            }
        }
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
