
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { Vec2 } from "fluidengine";


export interface MovementControlComponent {
    accelerationInput: Vec2;
    yawInput: number;
};

export const MovementControl = Fluid.defineComponentType<MovementControlComponent>("Movement Control");
