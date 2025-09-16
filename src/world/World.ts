
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { createChunk, ECSEntityId, getChunkCenterFromIndex, Vector2 } from "fluidengine";
import { ChunkIndex, ChunkMeta, ChunkKey, parseChunkKey, ChunkState } from "fluidengine";
import { SceneFacade } from "./Scene";
import { Fluid } from "fluidengine";
import { FluidEngine } from "fluidengine/internal";
import { boundedRandom } from "../../../FluidEngine/dist/lib/utils/MathUtils";
import { createAsteroid } from "../Asteroids";
import { Chunk } from "../components/ChunkComponent";
import { createSpriteEntity } from "../Sprites";


export interface ChunkGenerator {
    (worldContext: WorldContext, chunkIndex: ChunkIndex, chunkSize: number): ChunkMeta
}

export class WorldContext {
    private chunkMap: Map<ChunkKey, ChunkMeta> = new Map();
    // private unloadedEntitiesChunkMap = new Map<ChunkKey, Entity[]>();

    constructor(private engineInstance: FluidEngine, public readonly chunkSize: number, public readonly chunkTimeout: number, public generateChunk: ChunkGenerator) {
    }

    getChunk(key: ChunkKey): ChunkMeta | undefined {
        return this.chunkMap.get(key);
    }

    setChunk(key: ChunkKey, chunk: ChunkMeta): void {
        this.chunkMap.set(key, chunk);
    }

    loadChunk(key: ChunkKey): ChunkMeta {
        let chunk = this.chunkMap.get(key);
        // const unloadedEntities = this.unloadedEntitiesChunkMap.get(key);

        if (!chunk) {
            chunk = this.generateChunk(this, parseChunkKey(key), this.chunkSize);
            this.setChunk(key, chunk);
        } else {
            if (chunk.state === ChunkState.Loaded) {
                throw new Error(`Chunk is already loaded (chunk: ${key})`);
            }

            for (const entitySymbol of chunk.entitySymbolSet) {
                SceneFacade.loadEntity(entitySymbol);
            }
        }

        // if (chunk?.state === ChunkState.Unloaded && !unloadedEntities) {
        //     throw new Error(`Unloaded chunk entities are not defined (chunk: ${key})`);
        // }

        // if (unloadedEntities) {
        //     // Add all entities back to the engine
        //     unloadedEntities.forEach(e => this.engineInstance.addEntity(e));
        //     this.unloadedEntitiesChunkMap.delete(key);
        // }

        chunk.state = ChunkState.Loaded;
        return chunk;
    }

    unloadEntity(entityID: ECSEntityId, chunkKey: ChunkKey): void {
        // const unloadedEntities: Entity[] = this.unloadedEntitiesChunkMap.get(chunkKey) || [];
        // const entity = this.engineInstance.getEntityByID(entityID);
        // if (entity) {
        //     unloadedEntities.push(entity);
        //     Fluid.removeEntity(entityID);
        // }
        // this.unloadedEntitiesChunkMap.set(chunkKey, unloadedEntities);
        // else
        // console.warn(`Entity was not found in engine instance when unloading (entity: ${entityID}, chunk: ${chunkKey})\n\tIs this entity's chunk relationship current?`);

        SceneFacade.unloadEntity(entityID);
    }

    unloadChunk(key: ChunkKey): boolean {
        let chunk = this.chunkMap.get(key);

        if (!chunk) throw new Error(`Chunk is undefined (key: ${key})`);
        if (chunk.state === ChunkState.Unloaded) throw new Error(`Chunk is already unloaded (chunk: ${key})`);


        // for (let entityID of chunk.entitySymbolSet) {
        //     this.unloadEntity(entityID, key);
        // }

        const entityResolver = Fluid.core().getEntityManager().getEntityResolver();
        for (const entitySymbol of chunk.entitySymbolSet) {
            const entityId = entityResolver.getEntityBySymbol(entitySymbol);
            if (entityId)
                SceneFacade.unloadEntity(entityId);
        }

        chunk.state = ChunkState.Unloaded;
        return true;
    }

    getAllChunks(): ChunkMeta[] {
        return Array.from(this.chunkMap.values());
    }
}


export function generateChunk(
    worldContext: WorldContext,
    chunkIndex: ChunkIndex,
    chunkSize: number,
    engine: FluidEngine
): ChunkMeta {
    const chunkCenter = getChunkCenterFromIndex(chunkIndex[0], chunkIndex[1], chunkSize);
    // Creates background
    let chunkEntity = createSpriteEntity(
        chunkCenter,
        0,
        "backgroundTileImage",
        0,
        {
            x: chunkSize,
            y: chunkSize
        }

    );

    const halfChunkSize = chunkSize / 2;
    const nSubDivision = 3;
    const subGridSize = chunkSize / 3;
    const asteroidProbability = 0.3,
        sgap = asteroidProbability / (nSubDivision * nSubDivision);
    const minVelocity = 0.08, maxVelocity = 0.32,
        maxAngularVelocity = 1.2;
    const minSize = 0.08,
        maxSize = 0.40;
    const minDensity = 1,
        maxDensity = 2.2;

    for (let i = 0; i < nSubDivision; i++)
        for (let j = 0; j < nSubDivision; j++) {
            if (Math.random() > sgap)
                continue;

            let x = chunkCenter.x - halfChunkSize + i * subGridSize;
            let y = chunkCenter.y - halfChunkSize + j * subGridSize;
            let asteroidPosition = {
                x: boundedRandom(x, x + subGridSize),
                y: boundedRandom(y, y + subGridSize)
            }
            let asteroidRotation = Math.random() * 2 * Math.PI;
            let asteroidVelocity = Vector2.scale(
                Vector2.normalize(
                    {
                        x: Math.random() - 0.5,
                        y: Math.random() - 0.5
                    }),
                boundedRandom(minVelocity, maxVelocity)
            );
            const angularVelocity = boundedRandom(minVelocity, maxAngularVelocity);
            const size = boundedRandom(minSize, maxSize);
            const density = boundedRandom(minDensity, maxDensity);
            createAsteroid({
                position: asteroidPosition,
                velocity: asteroidVelocity,
                rotation: asteroidRotation,
                angularVelocity,
                width: size,
                options: {
                    density
                }
            });
        }

    const chunkMeta = createChunk(
        chunkIndex,
        chunkSize,
        ChunkState.Loaded,
        {
            entitySymbolSet: new Set([chunkEntity.getSymbol()]),
            lastAccessed: engine.getGameTime(),
        }
    );

    const chunkComponent = Chunk.createComponent({ chunk: chunkMeta }, false);
    Fluid.addEntityComponent(chunkEntity, chunkComponent);
    return chunkMeta;
}