
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";

export interface ParticleComponent {
    radius: number;
    color: string;
};

export const Particle = Fluid.defineComponentType<ParticleComponent>("Particle");
