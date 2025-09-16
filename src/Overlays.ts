import { CanvasRenderer } from "./client/renderer/Renderer";
import { ControlBinder } from "./ControlBindings";
import { drawComplexText } from "./Utils";

export function drawPauseScreen(
    renderContext: CanvasRenderingContext2D,
    renderer: CanvasRenderer
) {
    renderContext.save();

    renderContext.globalAlpha = 0.5;
    renderer.clear();
    renderContext.globalAlpha = 0.5;
    renderContext.font = "bold 256px calibri"
    renderContext.fillStyle = "white";
    renderContext.fillText("⏸", (renderer.getWidth() - 256) / 2, renderer.getHeight() / 2);

    renderContext.restore();
}


export function drawControlGuide(
    controlBinder: ControlBinder,
    renderContext: CanvasRenderingContext2D,
    renderer: CanvasRenderer
) {
    renderContext.save();
    renderContext.globalAlpha = 1;
    renderContext.font = "16px calibri"
    renderContext.fillStyle = "white";
    renderContext.textAlign = "left";

    const bindings = controlBinder.getBindings().filter(b => b.name && b.keys.length > 0 && b.enabled);
    const keysString = (keys: string[]) => `[ ${keys.map(k => `'${k.toUpperCase()}'`).join(" / ")} ]`;
    const textLines = bindings.map(b =>
        `${keysString(b.keys)}\t\t\t\t ${b.name}${b.continuous ? " (hold)" : ""}${b.description ? ` :${b.description}` : ""}\n`
    );

    const textPairing = textLines.map(line => [line, "white"] as [string, string]);

    drawComplexText(renderContext, 10, 20, textPairing, 4);


    renderContext.restore();
}