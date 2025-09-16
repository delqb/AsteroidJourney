import { MathUtils } from "fluidengine";

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

export interface DeltaTimeProvider {
    (): number;
}
export function drawComplexText(renderContext: CanvasRenderingContext2D, x: number, y: number, content = [["Colored ", "red"], ["\n"], ["Text ", "Blue"], ["Test", "Green"]], lineSpacing = 2) {
    const TEXT_METRICS = renderContext.measureText("A");
    const FONT_HEIGHT = TEXT_METRICS.actualBoundingBoxAscent + TEXT_METRICS.actualBoundingBoxDescent;

    let xOrig = x;
    for (const piece of content) {
        let text = piece[0];
        let color = piece.length > 1 ? piece[1] : renderContext.fillStyle;
        renderContext.fillStyle = color;
        if (text.includes("\n")) {
            for (const line of text.split("\n")) {
                renderContext.fillText(line, x, y);
                y += FONT_HEIGHT + lineSpacing;
                x = xOrig;
            }
        }
        else {
            renderContext.fillText(text, x, y);
            x += renderContext.measureText(text).width;
        }
    }
    return y;
}
