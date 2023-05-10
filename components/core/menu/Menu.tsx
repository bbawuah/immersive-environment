import { Room } from 'colyseus.js';
import React, { useState } from 'react';

import styles from './Menu.module.scss';
import { IconType } from '../../../utils/icons/types';
import { MutePlayer } from '../../domain/mutePlayer/mutePlayer';
import { IconButton } from '../IconButton/IconButton';
import { Icon } from '../icon/Icon';
import { useStore } from '../../../store/store';

interface Props {
  room: Room | undefined;
}

export const Menu: React.FC<Props> = (props) => {
  const { room } = props;
  const { players } = useStore(({ players }) => ({ players }));
  const [clickedPlayer, setClickedPlayer] = useState<string>();

  if (!room) {
    return null;
  }

  return (
    <>
      <div className={styles.modal}>
        <div className={styles.menu}>
          <div className={styles.menuContainer}>
            <p className={styles.menuTitle}>Menu</p>
          </div>

          <div className={styles.playersListContainer}>
            <p className={styles.playersListTitle}>Players</p>
            <ul>{renderPlayers()}</ul>
          </div>
        </div>
      </div>
      <MutePlayer
        shouldRender={clickedPlayer ? true : false}
        onClickOutside={() => setClickedPlayer(undefined)}
      >
        <div className={styles.modalHeaderContainer}>
          <button
            className={styles.modalCloseIconContainer}
            onClick={() => setClickedPlayer(undefined)}
          >
            <Icon icon={IconType.close} />
          </button>
          <h3>{renderModalTitle()}</h3>
        </div>
        <div className={styles.contentContainer}>
          <p className={styles.contentDescription}>{renderDescription()}</p>
          <div className={styles.buttonContainer}>
            <button
              className={styles.button}
              onClick={() => setClickedPlayer(undefined)}
            >
              Cancel
            </button>
            <button
              className={styles.button}
              onClick={() => handleMutePlayer()}
            >
              {renderButtonText()}
            </button>
          </div>
        </div>
      </MutePlayer>
    </>
  );

  function renderPlayers() {
    if (!players || !room) {
      return null;
    }
    const keys = Object.keys(players).filter(
      (playerId) => playerId !== room.sessionId
    );

    return keys.map((id, index) => {
      return (
        <li key={index}>
          <div className={styles.playersListItemContainer}>
            <p className={styles.playersName}>{id}</p>
            {players[id].isUnMuted ? (
              <IconButton
                icon={IconType.muted}
                className={styles.muteButton}
                onClick={() => setClickedPlayer(id)}
              />
            ) : (
              <IconButton
                icon={IconType.unmuted}
                className={styles.muteButton}
                onClick={() => setClickedPlayer(id)}
              />
            )}
          </div>
        </li>
      );
    });
  }

  function renderModalTitle() {
    if (players && clickedPlayer && players[clickedPlayer].isUnMuted) {
      return `Unmute player ${clickedPlayer}`;
    }

    return `Mute player ${clickedPlayer}`;
  }

  function renderDescription() {
    if (players && clickedPlayer && players[clickedPlayer].isUnMuted) {
      return `Do you want to send an unmute request to player ${clickedPlayer}?`;
    }

    return `Do you want to mute player ${clickedPlayer}?`;
  }

  function renderButtonText() {
    if (players && clickedPlayer && players[clickedPlayer].isUnMuted) {
      return `Unmute request`;
    }

    return `Mute`;
  }

  function handleMutePlayer() {
    if (!room) {
      return;
    }

    if (players && clickedPlayer && players[clickedPlayer].isUnMuted) {
      room.send('unmute request', { userToUnmute: clickedPlayer });
      setClickedPlayer(undefined);
      return;
    }

    room.send('mute request', { userToMute: clickedPlayer });
    setClickedPlayer(undefined);
  }
};
