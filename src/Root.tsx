import {Composition} from 'remotion';
import {AutomationVsAgent} from './AutomationVsAgent';
import {CasEmmaRousseau} from './CasEmmaRousseau';
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
      id="CasEmmaRousseau"
      component={CasEmmaRousseau}
      durationInFrames={FPS * 60}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
