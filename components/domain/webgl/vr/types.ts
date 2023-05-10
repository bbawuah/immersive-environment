import * as THREE from 'three';
import { ActionNames } from '../../../../store/store';

export interface XRTeleportationData {
  azimuthAngle: THREE.Vector3;
  position: THREE.Vector3;
}
