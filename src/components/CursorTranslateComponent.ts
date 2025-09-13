
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { Vec2 } from "fluidengine";


export interface CursorTranslateComponent {
    cursorTranslate: Vec2;
};

export const CursorTranslate = Fluid.defineComponentType<CursorTranslateComponent>("Cursor Translate");
