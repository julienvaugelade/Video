import {Composition} from 'remotion';
import {AutomationVsAgent} from './AutomationVsAgent';
import {N8nScenario, N8N_DURATION_S} from './N8nScenario';
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
      id="N8nScenario"
      component={N8nScenario}
      durationInFrames={FPS * N8N_DURATION_S}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
