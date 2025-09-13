import { Fluid } from "fluidengine";
import { PropertyAnimationData } from "../animation/PropertyAnimation";
import { ECSComponent, ECSComponentType } from "fluidengine";

export interface PropertyAnimationsComponent {
    animations: Map<symbol, Map<any, PropertyAnimationData<any, any>>>;
}

export const PropertyAnimation = Fluid.defineComponentType<PropertyAnimationsComponent>("Property Animation");

export function createPropertyAnimationsComponent(

    entries:
        [
            ECSComponentType<any>, Omit<PropertyAnimationData<any, any>, 'componentType'>[]
        ][]

): ECSComponent<PropertyAnimationsComponent> {
    const map: Map<symbol, Map<any, PropertyAnimationData<any, any>>> = new Map();
    for (const [componentType, animationsData] of entries) {
        for (const animationData of animationsData) {
            const componentTypeSymbol = componentType.getId().getSymbol();
            let innerMap = map.get(componentTypeSymbol);
            if (!innerMap) {
                innerMap = new Map();
                map.set(componentTypeSymbol, innerMap);
            }

            innerMap.set(animationData.propertyName, { componentType: componentType, ...animationData })
        }
    }
    return PropertyAnimation.createComponent({ animations: map });
}