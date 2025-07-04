
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine/v0";
import { Vec2, RectSize, Transform, AABB, OBB, Vector2, createTransform } from "fluidengine/v0/lib";


export interface BoundingBoxComponent {
    // Center and rotation are computed from position + transform in a system then stored here
    center: Vec2;
    rotation: number;
    size: RectSize;
    transform?: Transform;
    aabb?: AABB;
    obb?: OBB;
}

export const BoundingBox = Fluid.defineComponentType<BoundingBoxComponent>("BoundingBox");

export function createBoundingBox(size: RectSize, { center = Vector2.zero(), rotation = 0, transform = createTransform(), aabb = undefined, obb = undefined } = {}): BoundingBoxComponent {
    return { center, rotation, size, transform, obb, aabb };
}