
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Transform } from "fluidengine/v0/lib";
import { ProjectileType } from "../Projectiles";


export interface ProjectileSourceComponent {
    transform?: Transform;
    muzzleSpeed: number;
    fireRate: number;
    lastFireTime: number;
    projectileWidth: number;
    projectileType: ProjectileType;
}

export const ProjectileSource = Fluid.defineComponentType<ProjectileSourceComponent>("Projectile Source");
