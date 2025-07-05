import { FluidEngine, FluidSystem } from "fluidengine/v0/internal";
import { PropertyAnimation } from "../../../components/PropertyAnimationComponent";
import { Fluid } from "fluidengine/dev";
import { ECSNode } from "fluidengine/v0/api";
import { InterpolationId } from "../../../animation/Interpolator";
import { Interpolator } from "../../../animation/Interpolator";

const schema = {
    propertyAnimation: PropertyAnimation
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Property Animation Node");

export class PropertyAnimationSystem extends FluidSystem<Schema> {
    constructor(
        private engineInstance: FluidEngine,
        private resolveInterpolator: (interpolationId: InterpolationId) => Interpolator<any>
    ) {
        super("Property Animation System", nodeMeta);
    }
    updateNode(node: ECSNode<Schema>): void {
        const { propertyAnimation, entityId } = node;
        const deltaTime = this.engineInstance.getDeltaTime();

        for (const [componentTypeSymbol, animationMap] of propertyAnimation.animations.entries())
            for (const [propertyName, animation] of animationMap.entries()) {
                const { componentType, duration, elapsed, beginningValue, interpolationId, propertyName, endingValue, loop, onComplete } = animation;

                if (animation.completed || !Fluid.entityHasComponent(entityId, componentType))
                    continue;

                // Advance animation
                animation.elapsed += deltaTime;

                const interpolator = this.resolveInterpolator(interpolationId);
                const clampedElapsed = Math.min(elapsed, duration);
                const nextValue = interpolator(beginningValue, endingValue, clampedElapsed, duration);
                const component = Fluid.getEntityComponent(entityId, componentType);

                component.data[propertyName] = nextValue;

                if (elapsed >= duration) {
                    if (loop) {
                        animation.elapsed = 0;
                    } else {
                        animation.completed = true;
                        onComplete?.(entityId, propertyAnimation);
                    }
                }
            }
    }
}