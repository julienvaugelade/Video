import {Composition} from 'remotion';
import {AutomationVsAgent} from './AutomationVsAgent';
import {FPS, DURATION_S} from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AutomationVsAgent"
    component={AutomationVsAgent}
    durationInFrames={FPS * DURATION_S}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
