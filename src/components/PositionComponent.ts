
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Vec2 } from "fluidengine/v0/lib";


export interface PositionComponent {
    position: Vec2;
    rotation: number;
};

export const Position = Fluid.defineComponentType<PositionComponent>("Position");
