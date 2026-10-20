export interface CameraTuning {
  fov: number;
  ambientX: number;
  ambientY: number;
  ambientZ: number;
  enteredX: number;
  enteredY: number;
  enteredZ: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  driftX: number;
  driftY: number;
  focusDistance: number;
  focusYOffset: number;
  idleLerp: number;
  focusLerp: number;
}

export const DEFAULT_CAMERA_TUNING: CameraTuning = {
  fov: 38,
  ambientX: 0,
  ambientY: 0.2,
  ambientZ: 6.5,
  enteredX: 0,
  enteredY: 0.2,
  enteredZ: 3.8,
  lookAtX: 0,
  lookAtY: 0,
  lookAtZ: 0,
  driftX: 0.45,
  driftY: 0.07,
  focusDistance: 2,
  focusYOffset: 0.1,
  idleLerp: 0.035,
  focusLerp: 0.06,
};
