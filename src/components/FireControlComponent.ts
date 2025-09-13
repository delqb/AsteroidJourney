
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";


export interface FireControlComponent {
    fireIntent: boolean;
};

export const FireControl = Fluid.defineComponentType<FireControlComponent>("Fire Control");
