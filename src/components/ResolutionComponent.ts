
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Vec2 } from "fluidengine/v0/lib";


export interface ResolutionComponent {
    resolution: Vec2;
};

export const Resolution = Fluid.defineComponentType<ResolutionComponent>("Resolution");
