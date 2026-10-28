import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import timing from './timing.json';
import {Volet} from './motifs';
import {Commande, Desserts, Engagements, Fin, Intro, Menu, Origines, Promesse} from './scenes';
import {b, P} from './theme';

// Vidéos de présentation du restaurant Le Break African Food (Toulouse).
// Le découpage (en temps à 120 BPM) est dans timing.json, partagé avec scripts/lebreak_audio.py.

type Config = {beats: number; scenes: (string | number)[][]; plats: string[]; beatsParPlat: number};

const SCENES: Record<string, React.FC> = {
  intro: Intro,
  promesse: Promesse,
  origines: Origines,
  engagements: Engagements,
  desserts: Desserts,
  commande: Commande,
  fin: Fin,
};

const Video: React.FC<{config: Config; son: string}> = ({config, son}) => {
  const scenes = config.scenes as [string, number][];
  return (
    <AbsoluteFill style={{background: P.nuit}}>
      {scenes.map(([nom, debut], i) => {
        const fin = i < scenes.length - 1 ? scenes[i + 1][1] : config.beats;
        const Scene = SCENES[nom];
        return (
          <Sequence key={nom} from={b(debut)} durationInFrames={b(fin - debut)}>
            {nom === 'menu' ? <Menu plats={config.plats} beatsParPlat={config.beatsParPlat} /> : <Scene />}
          </Sequence>
        );
      })}
      {scenes.slice(1).map(([nom, debut]) => (
        <Volet key={nom} at={b(debut)} />
      ))}
      <Audio src={staticFile(son)} />
    </AbsoluteFill>
  );
};

export const LeBreak30: React.FC = () => <Video config={timing.v30} son="lebreak/son-30s.mp3" />;
export const LeBreak45: React.FC = () => <Video config={timing.v45} son="lebreak/son-45s.mp3" />;

export const DUREE_30 = b(timing.v30.beats);
export const DUREE_45 = b(timing.v45.beats);
