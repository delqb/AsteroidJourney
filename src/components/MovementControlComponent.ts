
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface MovementControlComponent {
    accelerationInput: Vec2;
    yawInput: number;
};

export const MovementControl = Fluid.defineComponentType<MovementControlComponent>("Movement Control");
