import {Composition} from 'remotion';
import {AutomationVsAgent} from './AutomationVsAgent';
import {DUREE_30, DUREE_45, LeBreak30, LeBreak45} from './lebreak/LeBreak';
import {FPS, DURATION_S} from './theme';

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
    <Composition id="LeBreak30s" component={LeBreak30} durationInFrames={DUREE_30} fps={FPS} width={1920} height={1080} />
    <Composition id="LeBreak45s" component={LeBreak45} durationInFrames={DUREE_45} fps={FPS} width={1920} height={1080} />
  </>
);
