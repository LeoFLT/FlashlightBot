import config from "../config/envVars";
import { Match, Type as EventType, Game, Mod as LobbyMod, Team, TeamType, User } from "../definitions/Match";
import { median } from "../utils/math";
import { parsedArgs } from "../utils/parser";
import fetch from "node-fetch";
import {
    Client as DiscordClient,
    ClientOptions as DiscordOptions,
    Collection as DiscordCollection
} from "discord.js";

export namespace Flashlight {
    export namespace MatchCosts {
        export interface mapIndex {
            startIndex?: number;
            endIndex?: number;
            midIndex?: number[];
        };
        export type Mods = {
            [key in LobbyMod]?: number;
        }
        export type Return = {
            playerList: Map<number, User>;
            teamType: TeamType;
            gameList: Map<number, { medianScore: number }>;
            teamScores?: { red: number, blue: number };
            medianLobby: number;
            gameMode: { osu: boolean, taiko: boolean, mania: boolean, fruits: boolean }
        }
    }

    export interface OsuOptions {
        tokenInfo?: {
            token_type: "Bearer"
            expires_in: number,
            expires_at: Date,
            access_token: string
        }
    }

    export interface Event {
        name: string;
        once: boolean;
        execute(client: Flashlight.Client, ...events: any[]): void;
    }

    export interface Command {
        name: string;
        aliases: string[];
        hasArgs: boolean;
        description: string;
        usage?: string;
        example?: string;
        execute(client: Flashlight.Client, args?: parsedArgs, ...events: any[]): void;
    }

    export class Client extends DiscordClient {
        commands: DiscordCollection<string, Command>;
        osu: Flashlight.OsuOptions;

        constructor(options: DiscordOptions) {
            super(options);
            this.commands = new DiscordCollection();
            this.osu = { };
        }

        private get osuTokenIsValid(): boolean {
            if (!this.osu.tokenInfo?.expires_at || !this.osu.tokenInfo?.access_token)
                return false;
            // token is almost certainly invalid by now (or it will be in the next 10 seconds)
            return (Math.abs(Date.now() - this.osu.tokenInfo.expires_at.getTime()) > 10000);
        }

        private async osuRequest(endpoint: string) {
            if (!this.osuTokenIsValid)
                try {
                    await this.requestToken();
                } finally {
                    if (!this.osuTokenIsValid)
                        throw new Error ("osu-token-invalid-after-refresh");
                }
            
            const headers = {
                "Authorization": `Bearer ${this.osu.tokenInfo?.access_token}`,
                "Accept": "application/json",
                "Content-Type": "application/json",
            };
            const req = await fetch(`https://osu.ppy.sh/api/v2/${endpoint}`, {
                method: "GET",
                headers: headers
            });

            return req;
        }

        async requestToken(): Promise<OsuOptions> {
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

            if (!this.osu?.tokenInfo)
                throw new Error ("invalid-token-value");

            this.osu.tokenInfo.expires_at = new Date(Date.now() + (res.expires_in * 1000));
            return this.osu;
        }

        async fetchMultiplayer(lobby: string, options?: {
            multipliers?: MatchCosts.Mods,
            mapIndex?: MatchCosts.mapIndex
        }): Promise<MatchCosts.Return> {
            let eventIdCursor = 0;
            const modEnum = {
                'NM': 1, 'NF': 1, 'EZ': 1,
                'HD': 1, 'HR': 1, 'SD': 1,
                'DT': 1, 'RX': 1, 'HT': 1,
                'NC': 1, 'FL': 1, 'SO': 1, 'PF': 1
            };
            let lobbyPlayerMapCounts: number[] = [];
            if (options?.hasOwnProperty("multipliers")) {
                for (const mod in options.multipliers) {
                    let currMod: LobbyMod = LobbyMod[mod as keyof typeof LobbyMod];
                    
                    if (modEnum.hasOwnProperty(currMod)) {
                        if (currMod === LobbyMod.NC)
                            currMod = LobbyMod.DT;

                        let newMultiplier = options.multipliers[currMod];
                        if (typeof newMultiplier === "number") {
                            if (newMultiplier > 10) newMultiplier = 10;
                            else if (newMultiplier <= 0) newMultiplier = 0;
                            modEnum[currMod] = newMultiplier;
                        }
                    }
                }
            }

            const lobbyIdMatch = lobby.match(/(?:https:\/\/osu\.ppy\.sh\/(?:community\/matches\/|mp\/))?(\d{3,15})\/?/);

            if (!Array.isArray(lobbyIdMatch))
                throw new Error("no-regex-match");

            const lobbyId = lobbyIdMatch[1];
            const req = await this.osuRequest(`matches/${lobbyId}`);

            if (!req.ok)
                throw new Error("api-call-fail-not-200");

            const res: Match = await req.json();
            const playerListMap = new Map<User["id"], User>();

            if (res.events[0].detail.type !== EventType.MatchCreated) {
                // we're missing data, query again
                if (eventIdCursor === 0) {
                    /* First time using the cursor to find missing data,
                    setting the first known event as the current cursor.
                    This approach should (hopefully) minimize errors */
                    eventIdCursor = res.events[0].id;
                } else if (eventIdCursor === res.events[0].id) {
                    // nothing changed, no way to recover
                    throw new Error("api-call-fail-no-change");
                }
                const newReq = await this.osuRequest(`matches/${lobbyId}?before=${res.events[0].id}`);
                if (!req.ok)
                    throw new Error("api-call-fail-not-200");
                const newRes: Match = await newReq.json();
                res.events.unshift(...newRes.events);
            }
            for (const player of res.users) {
                playerListMap.set(player.id, {
                    ...player,
                    mapAmount: 0,
                    matchCost: 0,
                    scores: []
                });
            }

            if (playerListMap.size === 2) {
                let i = 0;
                for (const [K, V] of playerListMap.entries()) {
                    if (i === 0) {
                        playerListMap.set(K, { ...V, team: Team.Red });
                        i++;
                    }
                    playerListMap.set(K, { ...V, team: Team.Blue });
                }
            }

            const mpLobby = {
                playerList: playerListMap,
                teamType: playerListMap.size === 2 ? TeamType.OneVS : TeamType.Unknown,
                gameList: new Map<User["id"], any>(),
                teamScores: { "red": 0, "blue": 0 },
                medianLobby: 0,
                gameMode: {
                    osu: false,
                    taiko: false,
                    mania: false,
                    fruits: false,
                }
            };

            let gameEvents: Game[] = [];
            for (const event in res.events) {
                const currEvent = res.events[event];
                if (currEvent?.detail.type === EventType.Other && currEvent?.game) {
                    gameEvents.push(currEvent.game);
                }
            }

            if (options?.mapIndex) {
                let midIndex, startIndex, endIndex;
                if (options.mapIndex.startIndex)
                    startIndex = options.mapIndex.startIndex as number;
                if (options.mapIndex.endIndex)
                    endIndex = options.mapIndex.endIndex as number;
                if (options.mapIndex.midIndex)
                    midIndex = options.mapIndex.midIndex;
                
                if (startIndex && startIndex > gameEvents.length)
                    throw new Error("invalid-map-index-start");
                if (endIndex && endIndex > gameEvents.length)
                    throw new Error("invalid-map-index-end");
                if (startIndex && endIndex && startIndex + endIndex >= gameEvents.length)
                    throw new Error("invalid-map-index-sum");
                if (startIndex)
                    gameEvents = gameEvents.slice(startIndex);
                if (endIndex) {
                    if (gameEvents.length <= endIndex)
                        throw new Error("invalid-map-index-end");

                    gameEvents = gameEvents.slice(0, -endIndex);
                }
                if (midIndex) {
                    if (gameEvents.length <= midIndex.length)
                        throw new Error("invalid-map-index-mid");

                    for (const i of midIndex) {
                        let mapFound = false;
                        for (const [index, game] of gameEvents.entries()) {
                            if (game.beatmap?.id === i || game.beatmap?.beatmapset_id === i) {
                                gameEvents.splice(index, 1);
                                mapFound = true;
                                break;
                            }
                        }
                        
                        if (!mapFound)
                            gameEvents.splice(i - 1, 1);
                    }
                }
            }

            for (const game of gameEvents) {
                let redTotalScore = 0;
                let blueTotalScore = 0;
                const scores = [];
                mpLobby.gameMode[game.mode] = true;

                if (mpLobby.teamType === TeamType.Unknown)
                    mpLobby.teamType = game.team_type;

                for (const score of game.scores) {
                    const player = mpLobby.playerList.get(score.user_id);
                    if (!player) continue;

                    if (mpLobby.teamType !== TeamType.OneVS)
                        player.team = score.match.team;

                    if (score.score > 1000) {
                        if (typeof modEnum.NM === "number")
                            score.score *= modEnum.NM;
                        if (mpLobby.teamType === TeamType.TeamVS) {
                            if (score.match.team === Team.Red)
                                redTotalScore += score.score;
                            if (score.match.team === Team.Blue)
                                blueTotalScore += score.score;
                        }

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
                        if (mpLobby.teamType === TeamType.TeamVS) {
                            if (player?.team && player.team !== Team.None)
                                player.team = score.match.team;
                        }
                        else if (mpLobby.teamType === TeamType.OneVS) {
                            if (player.team === Team.Red)
                                player.team = Team.Red;
                            player.team = Team.Blue;
                        }
                        player.mapAmount++;
                    }
                }
                mpLobby.gameList.set(game.id, { medianScore: median(scores) });
                if (mpLobby.teamType === TeamType.TeamVS) {
                    if (redTotalScore > blueTotalScore)
                        mpLobby.teamScores.red++;

                    if (blueTotalScore > redTotalScore)
                        mpLobby.teamScores.blue++;
                }
                else if (mpLobby.teamType === TeamType.OneVS) {
                }
            }

            mpLobby.playerList.forEach(V => {
                if (V.mapAmount > 0)
                    lobbyPlayerMapCounts.push(V.mapAmount);
            });

            mpLobby.medianLobby = median(lobbyPlayerMapCounts);
            mpLobby.playerList.forEach(player => {
                let scoreSum = 0;
                for (const score of player.scores) {
                    scoreSum += (score.score / mpLobby.gameList.get(score.id as number)?.medianScore);
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
};
