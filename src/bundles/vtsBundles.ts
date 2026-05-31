import type { Parameter, ParameterBundle } from "../core/types";

export const ARKIT_BLENDSHAPES = [
  'EyeBlinkLeft', 'EyeLookDownLeft', 'EyeLookInLeft', 'EyeLookOutLeft', 'EyeLookUpLeft', 'EyeSquintLeft', 'EyeWideLeft',
  'EyeBlinkRight', 'EyeLookDownRight', 'EyeLookInRight', 'EyeLookOutRight', 'EyeLookUpRight', 'EyeSquintRight', 'EyeWideRight',
  'JawForward', 'JawLeft', 'JawRight', 'JawOpen',
  'MouthClose', 'MouthFunnel', 'MouthPucker', 'MouthLeft', 'MouthRight', 'MouthSmileLeft', 'MouthSmileRight', 'MouthFrownLeft', 'MouthFrownRight', 'MouthDimpleLeft', 'MouthDimpleRight', 'MouthStretchLeft', 'MouthStretchRight', 'MouthRollLower', 'MouthRollUpper', 'MouthShrugLower', 'MouthShrugUpper', 'MouthPressLeft', 'MouthPressRight', 'MouthLowerDownLeft', 'MouthLowerDownRight', 'MouthUpperUpLeft', 'MouthUpperUpRight',
  'BrowDownLeft', 'BrowDownRight', 'BrowInnerUp', 'BrowOuterUpLeft', 'BrowOuterUpRight',
  'CheekPuff', 'CheekSquintLeft', 'CheekSquintRight',
  'NoseSneerLeft', 'NoseSneerRight',
  'TongueOut'
];

function createParams(ids: string[]): Map<string, Parameter<number>> {
  const map = new Map<string, Parameter<number>>();
  for (const id of ids) {
    map.set(id, { id, value: 0 });
  }
  return map;
}

export function createHeadJointsBundle(): ParameterBundle {
  return {
    id: 'HeadJoints',
    groupName: 'Head Joints',
    parameters: createParams(['Position.x', 'Position.y', 'Position.z', 'Rotation.x', 'Rotation.y', 'Rotation.z'])
  };
}

export function createEyeJointsBundle(): ParameterBundle {
  return {
    id: 'EyeJoints',
    groupName: 'Eye Joints',
    parameters: createParams(['EyeLeft.x', 'EyeLeft.y', 'EyeLeft.z', 'EyeRight.x', 'EyeRight.y', 'EyeRight.z'])
  };
}

export function createARKitBundle(): ParameterBundle {
  return {
    id: 'ARKit',
    groupName: 'ARKit Blendshapes',
    parameters: createParams(ARKIT_BLENDSHAPES)
  };
}