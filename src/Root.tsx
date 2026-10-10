import {Composition} from 'remotion';
import {AutomationVsAgent} from './AutomationVsAgent';
import {ToolkitDemo, TOOLKIT_DEMO_FRAMES} from './toolkit/ToolkitDemo';
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
      id="ToolkitDemo"
      component={ToolkitDemo}
      durationInFrames={TOOLKIT_DEMO_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
