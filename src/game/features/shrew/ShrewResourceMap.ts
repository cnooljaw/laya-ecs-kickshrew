import { ShrewType, MapType } from "./ShrewTypes";

/** 地鼠资源映射 — shrewType+mapType → 各部件精灵帧名 */
export interface ShrewResMap {
  body: string;
  face: string;
  faceCry: string;
  leftHand: string;
  rightHand: string;
  leftEar: string;
  rightEar: string;
  swelling: string;
  prop: string;
  /** 蓝鼠专用 */
  hat?: string;
  hatFrames?: string[];
  faceAngry?: string;
  handLeftUp?: string;
  handRightUp?: string;
  handLeftDizzy?: string;
  handRightDizzy?: string;
  /** 绿鼠专用 */
  leftEye?: string;
  rightEye?: string;
  leftEyeDizzy?: string;
  rightEyeDizzy?: string;
  leftEyeDizzy1?: string;
  rightEyeDizzy1?: string;
}

type ResMapKey = `${ShrewType}-${MapType}`;
const resMap: Map<string, ShrewResMap> = new Map();

function k(shrewType: ShrewType, mapType: MapType): ResMapKey {
  return `${shrewType}-${mapType}` as ResMapKey;
}

// 红色地鼠 — 各场景道具
resMap.set(k(ShrewType.Red, MapType.Meadow), {
  body: "red_body.png", face: "red_face_smile.png", faceCry: "red_face_cry.png",
  leftHand: "red_hand_left.png", rightHand: "red_hand_right.png",
  leftEar: "red_ear_left_up.png", rightEar: "red_ear_right_up.png",
  swelling: "red_swelling.png", prop: "red_prop_bean.png",
});
resMap.set(k(ShrewType.Red, MapType.Ship), {
  body: "red_body.png", face: "red_face_smile.png", faceCry: "red_face_cry.png",
  leftHand: "red_hand_left.png", rightHand: "red_hand_right.png",
  leftEar: "red_ear_left_up.png", rightEar: "red_ear_right_up1.png",
  swelling: "red_swelling.png", prop: "red_prop_Belt.png",
});
resMap.set(k(ShrewType.Red, MapType.Space), {
  body: "red_body.png", face: "red_face_smile.png", faceCry: "red_face_cry.png",
  leftHand: "red_hand_left.png", rightHand: "red_hand_right.png",
  leftEar: "red_ear_left_up.png", rightEar: "red_ear_right_up.png",
  swelling: "red_swelling.png", prop: "red_prop_light.png",
});

// 蓝色地鼠(BOSS) — 各场景帽子
resMap.set(k(ShrewType.Blue, MapType.Meadow), {
  body: "boss_body.png", face: "boss_face_smile.png", faceCry: "boss_face_miserable.png",
  faceAngry: "boss_face_angry.png",
  leftHand: "boss_hand_left_down.png", rightHand: "boss_hand_right_down.png",
  leftEar: "boss_ear_left.png", rightEar: "boss_ear_right.png",
  swelling: "boss_Swelling.png", prop: "",
  hat: "pumpkin01.png",
  hatFrames: ["pumpkin01.png", "pumpkin02.png", "pumpkin03.png", "pumpkin04.png", "pumpkin05.png"],
  handLeftUp: "boss_hand_left_up.png", handRightUp: "boss_hand_right_up.png",
  handLeftDizzy: "boss_hand_left_dizzy.png", handRightDizzy: "boss_hand_right_dizzy.png",
});
resMap.set(k(ShrewType.Blue, MapType.Ship), {
  body: "boss_body.png", face: "boss_face_smile.png", faceCry: "boss_face_miserable.png",
  faceAngry: "boss_face_angry.png",
  leftHand: "boss_hand_left_down.png", rightHand: "boss_hand_right_down.png",
  leftEar: "boss_ear_left.png", rightEar: "boss_ear_right.png",
  swelling: "boss_Swelling.png", prop: "",
  hat: "pirate01.png",
  hatFrames: Array.from({ length: 15 }, (_, i) => i < 9 ? `pirate0${i + 1}.png` : `pirate${i + 1}.png`),
  handLeftUp: "boss_hand_left_up.png", handRightUp: "boss_hand_right_up.png",
  handLeftDizzy: "boss_hand_left_dizzy.png", handRightDizzy: "boss_hand_right_dizzy.png",
});
resMap.set(k(ShrewType.Blue, MapType.Space), {
  body: "boss_body.png", face: "boss_face_smile.png", faceCry: "boss_face_miserable.png",
  faceAngry: "boss_face_angry.png",
  leftHand: "boss_hand_left_down.png", rightHand: "boss_hand_right_down.png",
  leftEar: "boss_ear_left.png", rightEar: "boss_ear_right.png",
  swelling: "boss_Swelling.png", prop: "",
  hat: "space01.png",
  hatFrames: ["space01.png", "space02.png", "space03.png", "space04.png", "space05.png"],
  handLeftUp: "boss_hand_left_up.png", handRightUp: "boss_hand_right_up.png",
  handLeftDizzy: "boss_hand_left_dizzy.png", handRightDizzy: "boss_hand_right_dizzy.png",
});

// 黄色地鼠
resMap.set(k(ShrewType.Yellow, MapType.Meadow), {
  body: "yellow_body.png", face: "yellow_face_smile.png", faceCry: "yellow_face_cry.png",
  leftHand: "yellow_hand_left.png", rightHand: "yellow_hand_right.png",
  leftEar: "yellow_ear_left_up.png", rightEar: "yellow_ear_right_up.png",
  swelling: "yellow_swelling.png", prop: "Yellow_prop_bean.png",
});
resMap.set(k(ShrewType.Yellow, MapType.Ship), {
  body: "yellow_body.png", face: "yellow_face_smile.png", faceCry: "yellow_face_cry.png",
  leftHand: "yellow_hand_left.png", rightHand: "yellow_hand_right.png",
  leftEar: "yellow_ear_left_up.png", rightEar: "yellow_ear_right_up.png",
  swelling: "yellow_swelling.png", prop: "yellow_prop_one_eye.png",
});
resMap.set(k(ShrewType.Yellow, MapType.Space), {
  body: "yellow_body.png", face: "yellow_face_smile.png", faceCry: "yellow_face_cry.png",
  leftHand: "yellow_hand_left.png", rightHand: "yellow_hand_right.png",
  leftEar: "yellow_ear_left_up.png", rightEar: "yellow_ear_right_up.png",
  swelling: "yellow_swelling.png", prop: "yellow_prop_black_glassess.png",
});

// 绿色地鼠
resMap.set(k(ShrewType.Green, MapType.Meadow), {
  body: "second_body.png", face: "second_face_smile.png", faceCry: "second_face_cry.png",
  leftHand: "second_hand_up_left.png", rightHand: "second_hand_up_right.png",
  leftEar: "second_ear_left.png", rightEar: "second_ear_right.png",
  swelling: "red_swelling.png", prop: "second_prop_grass.png",
  leftEye: "second_red_eye_left.png", rightEye: "second_red_eye_right.png",
  leftEyeDizzy: "second_eye_right_dizzy.png", rightEyeDizzy: "second_eye_left_dizzy.png",
  leftEyeDizzy1: "second_eye_right_dizzy1.png", rightEyeDizzy1: "second_eye_left_dizzy1.png",
});
resMap.set(k(ShrewType.Green, MapType.Ship), {
  body: "second_body.png", face: "second_face_smile.png", faceCry: "second_face_cry.png",
  leftHand: "second_hand_up_left.png", rightHand: "second_hand_up_right.png",
  leftEar: "second_ear_left.png", rightEar: "second_ear_right.png",
  swelling: "second_swelling_red.png", prop: "second_prop_redbelt_1.png",
  leftEye: "second_red_eye_left.png", rightEye: "second_red_eye_right.png",
  leftEyeDizzy: "second_eye_right_dizzy.png", rightEyeDizzy: "second_eye_left_dizzy.png",
  leftEyeDizzy1: "second_eye_right_dizzy1.png", rightEyeDizzy1: "second_eye_left_dizzy1.png",
});
resMap.set(k(ShrewType.Green, MapType.Space), {
  body: "second_body.png", face: "second_face_smile.png", faceCry: "second_face_cry.png",
  leftHand: "second_hand_up_left.png", rightHand: "second_hand_up_right.png",
  leftEar: "second_ear_left.png", rightEar: "second_ear_right.png",
  swelling: "second_swelling_belt.png", prop: "second_prop_glasses_hat.png",
  leftEye: "second_red_eye_left.png", rightEye: "second_red_eye_right.png",
  leftEyeDizzy: "second_eye_right_dizzy.png", rightEyeDizzy: "second_eye_left_dizzy.png",
  leftEyeDizzy1: "second_eye_right_dizzy1.png", rightEyeDizzy1: "second_eye_left_dizzy1.png",
});

export function getShrewRes(shrewType: ShrewType, mapType: MapType): ShrewResMap | undefined {
  return resMap.get(k(shrewType, mapType));
}
