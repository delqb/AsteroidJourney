import { Fluid } from "fluidengine";
import { Vec2 } from "fluidengine";

export interface PhysicsComponent {
    mass: number;
    centerOfMassOffset: Vec2;
    area: number;
    momentOfInertia: number;
}

export const Physics = Fluid.defineComponentType<PhysicsComponent>("Physics");