
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";


export interface ProjectileComponent {
    generation: number;
    deathTime: number;
    damage: number;
}

export const Projectile = Fluid.defineComponentType<ProjectileComponent>("Projectile");