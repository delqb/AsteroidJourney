
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface ComputedAccelerationComponent {
    computedAcceleration: Vec2;
};

export const ComputedAcceleration = Fluid.defineComponentType<ComputedAccelerationComponent>("Computed Acceleration");
