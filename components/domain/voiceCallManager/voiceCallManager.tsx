import { Room } from 'colyseus.js';
import React, { useEffect, useRef, useState } from 'react';
import { MediaConnection, Peer } from 'peerjs';
import styles from './voiceCallManager.module.scss';
import { Notifications } from '../../core/notifications/Notifications';
import { IconButton } from '../../core/IconButton/IconButton';
import { IconType } from '../../../utils/icons/types';

interface Props {
  room: Room | undefined;
}
interface AudioProps {
  stream: MediaStream;
}

const Audio: React.FC<AudioProps> = (props) => {
  const { stream } = props;
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return <audio className={styles.audio} playsInline ref={ref} autoPlay />;
};

const VoiceCallManager: React.FC<Props> = (props) => {
  const { room } = props;
  const peers = useRef<{ [id: string]: MediaConnection }>({});
  const [unmuteNotifications, setUnmuteNotifications] =
    useState<{ id: string; message: string }>();
  const [clickCounter, setClickCounter] = useState<number>(0);
  const [isUnMuted, setIsUnMuted] = useState<boolean>(false);
  const [myStream, setMyStream] = useState<MediaStream>();
  const [muteNotifications, setMuteNotifications] =
    useState<{ id: string; message: string }>();
  const [usersStreams, setUsersStreams] = useState<
    { id: string; stream: MediaStream }[]
  >([]);

  useEffect(() => {
    if (room) {
      room.onMessage('user-disconnected', (data: { id: string }) => {
        const { id } = data;
        if (peers.current[id]) {
          peers.current[id].close();
          setUsersStreams((v) => {
            const filter = v.filter((v) => v.id !== id);

            return filter;
          });
        }
      });

      room.onMessage('mute player', (data) => {
        const { id } = data;
        setIsUnMuted(false);

        if (myStream) {
          myStream.getAudioTracks()[0].enabled = false;
        }

        room.send('mute', { isUnMuted: true });
        setMuteNotifications({ id, message: `${id} has muted you.` });
        console.log(`${id} muted you`);
      });

      room.onMessage('unmute player', (data) => {
        const { id } = data;

        setUnmuteNotifications({ id, message: `${id} wants you to unmute.` });
        console.log(`${id} wants you to unmute.`);
      });
    }
  }, [room, myStream]);

  return (
    <>
      {muteNotifications && (
        <Notifications
          isSelfClosing={true}
          onDelete={() => setMuteNotifications(undefined)}
        >
          <p className={styles.notificationMessage}>
            {muteNotifications.message}
          </p>
        </Notifications>
      )}
      {unmuteNotifications && (
        <Notifications isSelfClosing={true}>
          <p className={styles.notificationMessage}>
            {unmuteNotifications.message}
          </p>
          <div className={styles.buttonContainer}>
            <button
              className={styles.button}
              onClick={() => setUnmuteNotifications(undefined)}
            >
              Cancel
            </button>
            <button
              className={styles.button}
              onClick={() => {
                if (clickCounter === 0) {
                  handleVoiceCall();
                }

                setIsUnMuted(true);
                if (myStream) {
                  myStream.getAudioTracks()[0].enabled = true;
                }

                setClickCounter((v) => v + 1);

                if (room) {
                  room.send('mute', { isUnMuted });
                }
                setUnmuteNotifications(undefined);
              }}
            >
              Unmute
            </button>
          </div>
        </Notifications>
      )}
      <div className={styles.canvasFooterMenu}>
        <IconButton
          icon={!isUnMuted ? IconType.muted : IconType.unmuted}
          onClick={() => {
            // Initiate voice call on first click
            if (clickCounter === 0) {
              handleVoiceCall();
            }

            setIsUnMuted(!isUnMuted);

            muteMic();

            setClickCounter((v) => v + 1);
          }}
        />

        {usersStreams.map((stream, index) => {
          return <Audio stream={stream.stream} key={index} />;
        })}
      </div>
    </>
  );

  function handleVoiceCall() {
    if (!room) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        setMyStream(stream);

        const peer = new Peer(room.sessionId);

        peer.on('open', (id) => {
          room.send('join-call', { id });
        });

        peer.on('call', (call) => {
          call.answer(stream);

          call.on('stream', (stream) => {
            setUsersStreams((v) => [...v, { id: call.peer, stream }]);
          });

          if (peers.current[call.peer]) {
            peers.current[call.peer] = call;
          } else {
            peers.current = { ...peers.current, [call.peer]: call };
          }
        });

        room.onMessage('user-connected', (data) => {
          const { id } = data;
          connectToNewUser(id, stream, peer);
        });
      });
  }

  function muteMic() {
    if (!room || !myStream) {
      return;
    }

    myStream.getAudioTracks()[0].enabled = !isUnMuted;
    room.send('mute', { isUnMuted });
  }

  function connectToNewUser(userId: string, stream: MediaStream, peer: Peer) {
    const call = peer.call(userId, stream);
    if (call) {
      call.on('stream', (audioStream) => {
        setUsersStreams((v) => [...v, { id: userId, stream: audioStream }]);
      });

      call.on('close', () => {
        console.log('close audio');
        setUsersStreams((v) => {
          const filter = v.filter((v) => v.id !== userId);
          return filter;
        });
      });

      if (peers.current[userId]) {
        peers.current[userId] = call;
      } else {
        peers.current = { ...peers.current, [userId]: call };
      }
    }
  }
};

export default VoiceCallManager;
