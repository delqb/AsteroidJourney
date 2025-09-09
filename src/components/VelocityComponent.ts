
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { Vec2 } from "fluidengine";



export interface VelocityComponent {
    velocity: Vec2;
    angular: number;
};

export const Velocity = Fluid.defineComponentType<VelocityComponent>("Velocity");
