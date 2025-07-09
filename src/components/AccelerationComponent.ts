
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Vec2 } from "fluidengine/v0/lib";


export class AccelerationComponent {
    constructor(
        public acceleration: Vec2,
        public angular: number
    ) {
    }
}

export const Acceleration = Fluid.defineComponentType<AccelerationComponent>("Acceleration");