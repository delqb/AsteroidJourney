import { Fluid } from "fluidengine/v0";

export interface ThrusterComponent {
    maxForce: number;
}

export const Thruster = Fluid.defineComponentType<ThrusterComponent>("Thruster");