
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Vec2 } from "fluidengine/v0/lib";



export interface VelocityComponent {
    velocity: Vec2;
    angular: number;
};

export const Velocity = Fluid.defineComponentType<VelocityComponent>("Velocity");
