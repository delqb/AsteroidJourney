
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { Vec2 } from "fluidengine";


export interface ResolutionComponent {
    resolution: Vec2;
};

export const Resolution = Fluid.defineComponentType<ResolutionComponent>("Resolution");
