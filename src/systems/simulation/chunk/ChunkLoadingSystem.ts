
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { ECSNode } from "fluidengine";
import { Fluid, FluidEngine, FluidSystem } from "fluidengine/internal";
import { getChunkIndexFromPosition, getChunkKeyFromIndex, ChunkState } from "fluidengine";
import { Position } from "../../../components/PositionComponent";
import { RenderCenter } from "../../../components/RenderCenterComponent";
import { WorldContext } from "../../../world/World";

const schema = {
    renderCenter: RenderCenter,
    position: Position
}

type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Chunk Loading");

export class ChunkLoadingSystem extends FluidSystem<Schema> {
    constructor(
        private engineInstance: FluidEngine,
        private worldContext: WorldContext
    ) {
        super("Chunk Loading System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const worldContext = this.worldContext;
        const chunkSize = worldContext.chunkSize;
        const gameTime = this.engineInstance.getGameTime();
        const renderCenterPos = node.position.position,
            renderDistance = node.renderCenter.renderDistance;
        const [ci, cj] = getChunkIndexFromPosition(renderCenterPos, chunkSize);

        const renderDistanceInChunks = Math.ceil(renderDistance / chunkSize);

        for (let i = -renderDistanceInChunks; i <= renderDistanceInChunks; i++)
            for (let j = -renderDistanceInChunks; j <= renderDistanceInChunks; j++) {
                const idxX = ci + i,
                    idxY = cj + j;

                const chunkKey = getChunkKeyFromIndex(idxX, idxY);
                let chunk = worldContext.getChunk(chunkKey);

                if (!chunk || chunk.state == ChunkState.Unloaded) {
                    try {
                        chunk = worldContext.loadChunk(chunkKey);
                    } catch (error) {
                        console.error(`Failed to load chunk (chunk: ${chunkKey})`, error);
                        continue;
                    }
                }

                chunk.lastAccessed = gameTime;
            }
    }
}