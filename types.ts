import { Camera as OriginalCamera } from "expo-camera";

export type Dimensions = { width: number; height: number };
export type CameraRef = OriginalCamera;
export type CameraRefCallback = (node: CameraRef) => void;
