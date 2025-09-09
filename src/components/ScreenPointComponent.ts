
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { Vec2 } from "fluidengine";


export interface ScreenPointComponent {
    point: Vec2;
};

export const ScreenPoint = Fluid.defineComponentType<ScreenPointComponent>("Screen Point");
