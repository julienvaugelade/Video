import {Composition} from 'remotion';
import {AutomationVsAgent} from './AutomationVsAgent';
import {ParcoursRS6601} from './ParcoursRS6601';
import {FPS, DURATION_S} from './theme';
import PARCOURS from './parcoursTiming.json';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AutomationVsAgent"
      component={AutomationVsAgent}
      durationInFrames={FPS * DURATION_S}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="ParcoursRS6601"
      component={ParcoursRS6601}
      durationInFrames={PARCOURS.fps * PARCOURS.durationS}
      fps={PARCOURS.fps}
      width={1920}
      height={1080}
    />
  </>
);
