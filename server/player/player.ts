import { Schema, type } from '@colyseus/schema';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Physics } from '../../shared/physics/physics';
import { IDirection } from './types';
import { IHandlePhysicsProps } from '../../shared/physics/types';

export class Player extends Schema {
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('string') id: string = '';
  @type('number') timestamp: number = 0;
  @type('boolean') isUnMuted: boolean = true;

  public playerSpeed: number = 10;
  public physicalBody: CANNON.Body;

  public direction: THREE.Vector3 = new THREE.Vector3();
  public frontVector: THREE.Vector3 = new THREE.Vector3();
  public sideVector: THREE.Vector3 = new THREE.Vector3();
  public upVector: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  public movement: IDirection = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    idle: false,
  };

  constructor(id: string, physics: Physics) {
    super();
    this.x = Math.floor(Math.random() * 6) + 1;
    this.y = 1;
    this.z = Math.floor(Math.random() * 6) + 1;
    this.id = id;

    this.physicalBody = physics.createPlayerPhysics<Player>(this); // Create phyisical represenatation of player

    physics.physicsWorld.addBody(this.physicalBody);
  }

  public handleMovement(data: IHandlePhysicsProps): void {
    const { userDirection, azimuthalAngle, timestamp } = data;
    // Get the player

    this.movement[userDirection] = true;
    this.handleUserDirection(azimuthalAngle);
    this.timestamp = timestamp;
    this.movement[userDirection] = false;
  }

  public handleUserDirection(angle: number): void {
    this.frontVector.setZ(
      Number(this.movement.backward) - Number(this.movement.forward)
    );
    this.sideVector.setX(
      Number(this.movement.left) - Number(this.movement.right)
    );

    this.direction
      .subVectors(this.frontVector, this.sideVector)
      .normalize()
      .multiplyScalar(this.playerSpeed)
      .applyAxisAngle(this.upVector, angle);

    this.physicalBody.velocity.set(
      this.direction.x,
      this.physicalBody.velocity.y,
      this.direction.z
    );

    // Misschien position in een array pushen?

    this.x = this.physicalBody.position.x;
    this.y = this.physicalBody.position.y;
    this.z = this.physicalBody.position.z;
  }
}
