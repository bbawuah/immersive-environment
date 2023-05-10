import { Client, Room } from 'colyseus';
import { XRTeleportationData } from '../../components/domain/webgl/vr/types';
import { Physics } from '../../shared/physics/physics';
import {
  IHandlePhysicsProps,
  IUserDirection,
} from '../../shared/physics/types';
import { Player } from '../player/player';
import { State } from '../state/state';

export class Gallery extends Room<State> {
  public maxClients = 30;
  private physics: Physics;
  public patchRate = 100;

  constructor() {
    super();
    this.physics = new Physics();
  }

  public onCreate() {
    this.setState(new State());
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));

    this.onMessage('move', (client, data) => {
      const player = this.state.players.get(client.sessionId);

      if (!player) {
        return;
      }

      player.handleMovement(data);

      this.broadcast(
        'move',
        { player },
        {
          afterNextPatch: true,
        }
      );
    });

    this.onMessage('idle', (client, data) => {
      const player = this.state.players.get(client.sessionId);

      if (player) {
        for (let movement in player.movement) {
          const key = movement as IUserDirection;
          player.movement[key] = false;
        }

        player.physicalBody.velocity.setZero();
        player.physicalBody.initVelocity.setZero();
        player.physicalBody.angularVelocity.setZero();
        player.physicalBody.initAngularVelocity.setZero();
      }
    });

    this.onMessage('teleport', (client, data: XRTeleportationData) => {
      const player = this.state.players.get(client.sessionId);
      const { position } = data;

      if (player) {
        player.x = position.x;
        player.y = position.y;
        player.z = position.z;
      }

      this.broadcast(
        'move',
        { player },
        {
          afterNextPatch: true,
        }
      );
    });

    this.onMessage(
      'sending private message',
      (client, data: { to: string; signal: any }) => {
        const { to, signal } = data;
        const receiver = this.clients.find((v) => v.sessionId === to);

        if (receiver) {
          receiver.send('sending private message', {
            signal,
            senderId: client.sessionId,
          });
        }
      }
    );

    this.onMessage(
      'answerCall',
      (client, data: { signal: any; to: string }) => {
        const { signal, to } = data;
        const receiver = this.clients.find((v) => v.sessionId === to);

        if (receiver) {
          receiver.send('callAccepted', { signal, id: client.sessionId });
        }
      }
    );
  }

  public onJoin(client: Client, options: any) {
    console.log('user joined');
    this.state.players.set(
      client.sessionId,
      new Player(client.sessionId, this.physics)
    );

    client.send('id', { id: client.sessionId });

    const players = (this.state as State).players;

    this.onMessage('test', (client, data: string) => {
      console.log(`${client.sessionId} has sent this message ${data}`);
    });

    if (players) {
      this.broadcast('spawnPlayer', { players });
    }

    this.onMessage('join-call', (client, data) => {
      const { id } = data;
      console.log(id);

      this.broadcast('user-connected', { id });
    });

    this.onMessage('sending signal', (client, payload) => {
      const receiver = this.clients.find(
        (v) => v.sessionId === payload.userToSignal
      );

      if (receiver) {
        console.log('running from sending signal');
        receiver.send('user joined', {
          signal: payload.signal,
          callerID: client.sessionId,
        });
      }
    });

    this.onMessage('returning signal', (client, payload) => {
      const receiver = this.clients.find(
        (v) => v.sessionId === payload.callerID
      );

      if (receiver) {
        receiver.send('receiving returned signal', {
          signal: payload.signal,
          id: client.sessionId,
        });
      }
    });

    this.onMessage('mute', (client, data: { isUnMuted: boolean }) => {
      const { isUnMuted } = data;
      const player = this.state.players.get(client.sessionId);

      if (player) {
        player.isUnMuted = isUnMuted;
      }

      const players = (this.state as State).players;

      this.broadcast('mute state', { players });
    });

    this.onMessage(
      'unmute request',
      (client, data: { userToUnmute: string }) => {
        const { userToUnmute } = data;

        const receiver = this.clients.find((v) => v.sessionId === userToUnmute);

        if (receiver) {
          receiver.send('unmute player', {
            id: client.sessionId,
          });
        }
      }
    );

    this.onMessage('mute request', (client, data: { userToMute: string }) => {
      const { userToMute } = data;

      const receiver = this.clients.find((v) => v.sessionId === userToMute);

      if (receiver) {
        receiver.send('mute player', {
          id: client.sessionId,
        });
      }
    });
  }

  public update(deltaTime: number) {
    this.physics.updatePhysics(deltaTime / 1000);
  }

  public onLeave(client: Client) {
    this.state.players.delete(client.sessionId);

    const players = this.state.players;

    if (players) {
      client.send('leave', { message: 'you left' });
      this.broadcast('user-disconnected', { id: client.sessionId });
      this.broadcast('removePlayer', {
        players,
      });
    }
  }

  onDispose() {
    console.log('Dispose ChatRoom');
  }
}
