
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { Vec2 } from "fluidengine";


export class AccelerationComponent {
    constructor(
        public acceleration: Vec2,
        public angular: number
    ) {
    }
}

export const Acceleration = Fluid.defineComponentType<AccelerationComponent>("Acceleration");