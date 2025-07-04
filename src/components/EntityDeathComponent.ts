
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";

export interface EntityDeathComponent {
    readyToRemove: boolean
}

export const EntityDeath = Fluid.defineComponentType<EntityDeathComponent>("Entity Death");