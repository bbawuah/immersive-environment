import React, { useRef } from 'react';
import { Modal } from '../../core/modal/modal';
import styles from './mutePlayer.module.scss';
import { useOutsideAlerter } from '../../../hooks/useOutsideAlerter';

interface Props {
  shouldRender: boolean;
  onClickOutside: () => void;
}

export const MutePlayer: React.FC<Props> = (props) => {
  const { shouldRender, onClickOutside, children } = props;
  const ref = useRef<HTMLDivElement | null>(null);

  useOutsideAlerter(ref, () => onClickOutside());

  if (!shouldRender) {
    return null;
  }

  return (
    <Modal>
      <div ref={ref} className={styles.container}>
        {children}
      </div>
    </Modal>
  );
};
