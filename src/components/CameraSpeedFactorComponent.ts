
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";

export interface CameraSpeedFactorComponent {
    speedFactor: number;
};

export const CameraSpeedFactor = Fluid.defineComponentType<CameraSpeedFactorComponent>("Camera Speed Factor");
