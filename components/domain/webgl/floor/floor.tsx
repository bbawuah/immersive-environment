import React from 'react';

interface Props {}

export const Floor: React.FC<Props> = (props) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial transparent opacity={0.3} color={'#99EAF5'} />
    </mesh>
  );
};
