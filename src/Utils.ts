import { MathUtils } from "fluidengine/v0/lib";

export function calculateRectangleMomentOfInertia(
    mass: number,
    width: number,
    height: number): number {
    return (1 / 12) * mass * (width * width + height * height);
} export function transformScaleLerpBulge(
    from: { scale: number; },
    to: { scale: number; },
    timeElapsed: number,
    totalDuration: number
): { scale: number; } {
    return {
        scale: MathUtils.lerp(from.scale, to.scale, Math.sin(Math.PI * timeElapsed / totalDuration))
    };
}

