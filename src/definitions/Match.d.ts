export interface Match {
    match:           MatchMatch;
    events:          EventType[];
    users:           User[];
    first_event_id:  number;
    latest_event_id: number;
    current_game_id: null;
}

export interface EventType {
    id:        number;
    detail:    Detail;
    timestamp: string;
    user_id:   number | null;
    game?:     Game;
}

export interface Detail {
    type:  Type;
    text?: string;
}

export enum Type {
    MatchDisbanded = "match-disbanded",
    Other = "other",
    PlayerJoined = "player-joined",
    PlayerLeft = "player-left",
}

export interface Game {
    id:           number;
    start_time:   string;
    end_time:     null | string;
    mode:         "osu" | "taiko" | "mania" | "fruits";
    mode_int:     number;
    scoring_type: string;
    team_type:    string;
    mods:         Mod[];
    beatmap?:     Beatmap;
    scores:       Score[];
}

export interface Beatmap {
    beatmapset_id:     number;
    difficulty_rating: number;
    id:                number;
    mode:              string;
    status:            string;
    total_length:      number;
    user_id:           number;
    version:           string;
    beatmapset:        Beatmapset;
}

export interface Beatmapset {
    artist:          string;
    artist_unicode:  string;
    covers:          { [key: string]: string };
    creator:         string;
    favourite_count: number;
    hype:            Hype | null;
    id:              number;
    nsfw:            boolean;
    play_count:      number;
    preview_url:     string;
    source:          string;
    status:          string;
    title:           string;
    title_unicode:   string;
    track_id:        number | null;
    user_id:         number;
    video:           boolean;
}

export interface Hype {
    current:  number;
    required: number;
}

export enum Mod {
    NF = "NF",
    EZ = "EZ",
    HD = "HD",
    HR = "HR",
    DT = "DT",
    NC = "NC",
    FL = "FL"
}

export interface Score {
    id:         null;
    user_id:    number;
    accuracy:   number;
    mods:       Mod[];
    score:      number;
    max_combo:  number;
    passed:     boolean;
    perfect:    number;
    statistics: Statistics;
    rank:       null;
    created_at: null;
    best_id:    null;
    pp:         null;
    match:      ScoreMatch;
}

export interface ScoreMatch {
    slot: number;
    team: Team;
    pass: boolean;
}

export enum Team {
    Blue = "blue",
    Red = "red",
}

export interface Statistics {
    count_50:   number;
    count_100:  number;
    count_300:  number;
    count_geki: number;
    count_katu: number;
    count_miss: number;
}

export interface MatchMatch {
    id:         number;
    start_time: string;
    end_time:   string;
    name:       string;
}

export interface User {
    avatar_url:      string;
    country_code:    string;
    default_group:   DefaultGroup;
    id:              number;
    is_active:       boolean;
    is_bot:          boolean;
    is_deleted:      boolean;
    is_online:       boolean;
    is_supporter:    boolean;
    last_visit:      null | string;
    pm_friends_only: boolean;
    profile_colour:  null | string;
    username:        string;
    country:         Country;
}

export interface Country {
    code: string;
    name: string;
}

export enum DefaultGroup {
    Alumni = "alumni",
    BN = "bn",
    Default = "default",
    GMT = "gmt",
    NAT = "nat"
}
