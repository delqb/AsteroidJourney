
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";

export interface AsteroidComponent {
    area: number
}

export const Asteroid = Fluid.defineComponentType<AsteroidComponent>("Asteroid");