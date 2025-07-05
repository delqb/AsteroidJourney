import { ECSComponent, ECSComponentType, ECSEntityId } from "fluidengine/v0/api";
import { InterpolationId } from "./Interpolator";
import { PropertyAnimationsComponent } from "../components/PropertyAnimationComponent";

export interface PropertyAnimationData<T, K extends keyof T> {
    componentType: ECSComponentType<T>;
    propertyName: K;
    beginningValue: T[K];
    endingValue: T[K];
    duration: number;
    elapsed: number;
    interpolationId: InterpolationId;
    onComplete:
    (entityId: ECSEntityId, propertyAnimationComponent: PropertyAnimationsComponent) => void;
    completed: boolean;
    loop?: boolean;
}

export function createPropertyAnimationData
    <T, K extends keyof T>(
        componentType: ECSComponentType<T>,
        propertyName: K,
        beginningValue: T[K],
        endingValue: T[K],
        duration: number,
        elapsed: number,
        interpolationId: InterpolationId,
        onComplete:
            (entityId: ECSEntityId, propertyAnimationComponent: PropertyAnimationsComponent) => void
            = (eid, pac) => pac.animations.delete(componentType.getId().getSymbol()),
        completed: boolean = false,
        loop: boolean = false
    ): PropertyAnimationData<T, K> {
    return {
        componentType,
        propertyName,
        beginningValue,
        endingValue,
        duration,
        elapsed,
        interpolationId,
        onComplete,
        completed,
        loop
    }
}
