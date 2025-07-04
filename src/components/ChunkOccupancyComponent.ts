
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ChunkKey } from "fluidengine/v0/lib";


/**
 * Component that tracks the set of chunks currently occupied by an entity.
 *
 * @property chunkKeys: A set containing keys of all chunks occupied by the entity.
 */
export interface ChunkOccupancyComponent {
    chunkKeys: Set<ChunkKey>;
};

export const ChunkOccupancy = Fluid.defineComponentType<ChunkOccupancyComponent>("Chunk Occupancy");