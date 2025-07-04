
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { ECSEntityId } from "fluidengine/v0/api";

export interface CollisionComponent {
    collidedEntity: ECSEntityId
}

export const Collision = Fluid.defineComponentType<CollisionComponent>("Collision");