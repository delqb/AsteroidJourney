
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface CursorTranslateComponent {
    cursorTranslate: Vec2;
};

export const CursorTranslate = Fluid.defineComponentType<CursorTranslateComponent>("Cursor Translate");
