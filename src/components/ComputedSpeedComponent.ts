
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Vec2 } from "fluidengine/v0/lib";


export interface ComputedSpeedComponent {
    computedSpeed: Vec2;
};

export const ComputedSpeed = Fluid.defineComponentType<ComputedSpeedComponent>("Computed Speed");
