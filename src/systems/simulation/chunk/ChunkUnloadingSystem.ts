
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid, FluidEngine } from "fluidengine/v0";
import { ECSNode } from "fluidengine/v0/api";
import { FluidSystem } from "fluidengine/v0/internal";
import { ChunkState } from "fluidengine/v0/lib";
import { Chunk } from "../../../components/ChunkComponent";
import { WorldContext } from "../../../world/World";


const schema = {
    chunk: Chunk
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Chunk Unloading");

export class ChunkUnloadingSystem extends FluidSystem<Schema> {
    constructor(
        private engineInstance: FluidEngine,
        private worldContext: WorldContext
    ) {
        super("Chunk Unloading System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const worldContext = this.worldContext;
        const { chunkTimeout } = this.worldContext;
        const gameTime = this.engineInstance.getGameTime();
        const chunk = node.chunk.chunk;

        if (chunk.state == ChunkState.Loaded && gameTime - chunk.lastAccessed >= chunkTimeout)
            try {
                worldContext.unloadChunk(chunk.key);
            } catch (error) {
                console.error(`Failed to unload chunk#${chunk.key}}:`, error);
            }
    }
}