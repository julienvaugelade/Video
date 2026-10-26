import {Composition} from 'remotion';
import {AutomationVsAgent} from './AutomationVsAgent';
import {GardeFousAgent} from './GardeFousAgent';
import {GardeFousAgentSenza} from './GardeFousAgentSenza';
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
    <Composition
      id="GardeFousAgent"
      component={GardeFousAgent}
      durationInFrames={FPS * 40}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="GardeFousAgentSenza"
      component={GardeFousAgentSenza}
      durationInFrames={FPS * 40}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
