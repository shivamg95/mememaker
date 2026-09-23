import type Konva from "konva";

let stage: Konva.Stage | null = null;

export function setStudioStage(next: Konva.Stage | null) {
  stage = next;
}

export function getStudioStage() {
  return stage;
}
