import { Vec2 } from "@fluid/lib/spatial/Vector2";

const floor = Math.floor;

export type ChunkIndex = [number, number] & { __brand: "ChunkIndex" };
export type ChunkKey = string & { __brand: "ChunkKey" };

export const enum ChunkState {
    Loaded = 1,
    Unloaded = 2,
}

export function isChunkState(value: any): value is ChunkState {
    return value === ChunkState.Loaded || value === ChunkState.Unloaded;
}

export interface ChunkMeta {
    readonly index: ChunkIndex;
    readonly key: ChunkKey;
    readonly size: number;
    state: ChunkState;
    lastAccessed: number;
    entitySymbolSet: Set<symbol>;
}

type ChunkCreationOptionalParameters = {
    lastAccessed?: number;
    entitySymbolSet?: Set<symbol>, size?: number
}

export function createChunk(index: ChunkIndex, size: number, state: ChunkState, options?: ChunkCreationOptionalParameters): ChunkMeta;
export function createChunk(key: ChunkKey, size: number, state: ChunkState, options?: ChunkCreationOptionalParameters): ChunkMeta;

export function createChunk(
    indexOrKey: ChunkIndex | ChunkKey, size: number, state: ChunkState,
    { lastAccessed = 0, entitySymbolSet = new Set<symbol>() } = {}
): ChunkMeta {
    let key: ChunkKey;
    let index: ChunkIndex;

    if (typeof indexOrKey === "string") {
        index = parseChunkKey(indexOrKey);
        key = indexOrKey;
    } else if (Array.isArray(indexOrKey) && indexOrKey.length === 2 &&
        typeof indexOrKey[0] === "number" && typeof indexOrKey[1] === "number") {
        index = indexOrKey;
        key = getChunkKeyFromIndex(indexOrKey[0], indexOrKey[1]);
    } else {
        throw new Error(`Invalid chunk parameters: expected chunk index [i,j] or key "i,j".\n\tReceived value: ${JSON.stringify(indexOrKey)}`);
    }

    if (!isChunkState(state)) {
        throw new Error(`Invalid chunk parameters: expected chunk state ('${ChunkState.Loaded}' or '${ChunkState.Unloaded}')\n\tReceived value:${state}`);
    }

    return {
        index,
        key,
        state,
        lastAccessed,
        entitySymbolSet: entitySymbolSet,
        size
    };
}

export function getChunkIndexFromPosition(pos: Vec2, chunkSize: number): ChunkIndex {
    return [floor(pos.x / chunkSize), floor(pos.y / chunkSize)] as ChunkIndex;
}

export function getChunkCornerFromIndex(i: number, j: number, chunkSize: number): Vec2 {
    return { x: i * chunkSize, y: j * chunkSize };
}

export function getChunkCenterFromIndex(i: number, j: number, chunkSize: number): Vec2 {
    return { x: (i + 0.5) * chunkSize, y: (j + 0.5) * chunkSize };
}

export function parseChunkKey(key: string, silent = false): ChunkIndex | undefined {
    if (typeof key !== "string") {
        if (silent)
            return undefined;
        throw new Error(`Invalid chunk key: expected a type of "string"\n\ttype:${typeof key}`);
    }

    const parts = key.split(",");
    if (parts.length !== 2) {
        if (silent)
            return undefined;
        throw new Error(`Invalid chunk key format: expected "x,y"\n\tvalue:"${key}"`);
    }

    const i = parseInt(parts[0], 10);
    const j = parseInt(parts[1], 10);

    if (isNaN(i) || isNaN(j)) {
        if (silent)
            return undefined;
        throw new Error(`Invalid chunk key indices: "${key}" does not contain valid integers`);
    }

    return [i, j] as ChunkIndex;
}

export function getChunkKeyFromIndex(i: number, j: number): ChunkKey {
    return `${i},${j}` as ChunkKey;
}