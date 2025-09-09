
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { ECSEntityId } from "fluidengine";

export interface CollisionComponent {
    collidedEntity: ECSEntityId
}

export const Collision = Fluid.defineComponentType<CollisionComponent>("Collision");