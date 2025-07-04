
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Vec2 } from "fluidengine/v0/lib";


export interface ComputedAccelerationComponent {
    computedAcceleration: Vec2;
};

export const ComputedAcceleration = Fluid.defineComponentType<ComputedAccelerationComponent>("Computed Acceleration");
