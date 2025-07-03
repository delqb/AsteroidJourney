
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface VelocityComponent {
    velocity: Vec2;
    angular: number;
};

export const Velocity = Fluid.defineComponentType<VelocityComponent>("Velocity");
