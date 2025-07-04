
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";

export interface LifeTimeComponent {
    spawnTime: number,
    lifeDuration: number
}
export const LifeTime = Fluid.defineComponentType<LifeTimeComponent>("Lifetime");