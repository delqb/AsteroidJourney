import { FluidEngine, FluidSystem } from "fluidengine/internal";
import { PropertyAnimation } from "../../../components/PropertyAnimationComponent";
import { Fluid } from "fluidengine";
import { ECSNode } from "fluidengine";
import { InterpolationId } from "../../../animation/Interpolators";
import { Interpolator } from "../../../animation/Interpolators";

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