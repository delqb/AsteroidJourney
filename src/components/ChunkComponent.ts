
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ChunkMeta } from "fluidengine/v0/lib";


/**
 * Component used to associate an entity with a 'Chunk' instance. 
 * 
 * This enables world chunks to be represented as entities within the ECS.
 * 
 * @property chunk: The underlying 'Chunk' instance this entity represents.
 */
export interface ChunkComponent {
    chunk: ChunkMeta;
}

export const Chunk = Fluid.defineComponentType<ChunkComponent>("Chunk");