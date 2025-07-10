
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";

export interface HealthComponent {
    maxHealth: number;
    currentHealth: number;
    visible?: boolean;
}

export const Health = Fluid.defineComponentType<HealthComponent>("Health");
