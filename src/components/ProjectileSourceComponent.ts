
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Transform } from "fluidengine/v0/lib";


export interface ProjectileSourceComponent {
    transform?: Transform;
    muzzleSpeed: number;
    fireRate: number;
    lastFireTime: number;
    projectileSize: number;
    projectileLifeTime: number;
}

export const ProjectileSource = Fluid.defineComponentType<ProjectileSourceComponent>("Projectile Source");
