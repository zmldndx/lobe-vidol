import { VRMExpressionPresetName } from '@pixiv/three-vrm';
import { message } from 'antd';
import classNames from 'classnames';
import React, { memo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ScreenLoading from '@/components/ScreenLoading';
import { useLoadModel } from '@/hooks/useLoadModel';
import { MotionPresetName } from '@/libs/emoteController/motionPresetMap';
import { MotionFileType } from '@/libs/emoteController/type';
import { speakCharacter } from '@/libs/messages/speakCharacter';
import { agentSelectors, useAgentStore } from '@/store/agent';
import { useGlobalStore } from '@/store/global';
import { TouchAreaEnum } from '@/types/touch';
import { preloadVoice } from '@/utils/voice';

import Background from './Background';
import ToolBar from './ToolBar';
import { useStyles } from './style';

// 假设我们有这个工具函数

interface Props {
  /**
   * agent id
   */
  agentId: string;
  className?: string;
  height?: number | string;
  /**
   * 是否可交互
   */
  interactive?: boolean;
  style?: React.CSSProperties;
  /**
   * 是否显示工具栏
   */
  toolbar?: boolean;
  width?: number | string;
}

function AgentViewer(props: Props) {
  const { className, style, height, agentId, width, interactive = true, toolbar = true } = props;
  const { styles } = useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const viewer = useGlobalStore((s) => s.viewer);
  const { t } = useTranslation('welcome');

  const { fetchModelUrl, percent: modelPercent } = useLoadModel();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [voiceLoadingProgress, setVoiceLoadingProgress] = useState(0);
  const [motionLoadingProgress, setMotionLoadingProgress] = useState(0);
  const agent = useAgentStore((s) => s.getAgentById(agentId));
  const getAgentTouchActionsByIdAndArea = useAgentStore((s) =>
    agentSelectors.getAgentTouchActionsByIdAndArea(s),
  );

  const handleTouchArea = (area: TouchAreaEnum) => {
    if (!interactive) {
      return;
    }
    const currentTouch = getAgentTouchActionsByIdAndArea(agentId, area);

    if (currentTouch) {
      // 随机挑选一个
      const touchAction = currentTouch[Math.floor(Math.random() * (currentTouch.length || 1))];
      if (touchAction) {
        speakCharacter(
          {
            expression: touchAction.expression,
            tts: {
              ...agent?.tts,
              message: touchAction.text,
            },
            motion: touchAction.motion,
          },
          viewer,
          {
            onComplete: () => {
              viewer.model?.loadIdleAnimation();
            },
            onError: () => {
              message.error(t('ttsTransformFailed', { ns: 'error' }));
            },
          },
        );
      }
    }
  };

  const preloadAgentResources = async () => {
    setLoading(true);
    setLoadingStep(1);
    try {
      // 加载步骤一： 加载模型
      const modelUrl = await fetchModelUrl(agent!.agentId, agent!.meta.model!);
      if (!modelUrl) return;
      await viewer.loadVrm(modelUrl);

      // 如果不是交互模式，加载到这里就结束了
      if (!interactive) return;

      setLoadingStep(2);
      // 加载步骤二: 预加载动作，目前预加载的动作都是通用的
      if (viewer?.model) {
        await viewer.model.preloadAllMotions((loaded, total) => {
          setMotionLoadingProgress((loaded / total) * 100);
        });
      }

      setLoadingStep(3);
      // 加载步骤三：加载语音
      let voiceCount = 0;
      let totalVoices = 0;

      // 计算总语音数量
      if (agent?.greeting) {
        totalVoices++;
      }
      const touchAreas = Object.values(TouchAreaEnum);
      for (const area of touchAreas) {
        const touchActions = getAgentTouchActionsByIdAndArea(agentId, area);
        if (touchActions) {
          totalVoices += touchActions.length;
        }
      }

      // 预加载语音，根据角色的语音配置不同，需要每次重新判断预加载
      // 这个是角色招呼语音
      if (agent?.greeting) {
        await preloadVoice({
          ...agent.tts,
          message: agent.greeting,
        });
        voiceCount++;
        setVoiceLoadingProgress((voiceCount / totalVoices) * 100);
      }
      // 这个是角色的触摸动画语音
      for (const area of touchAreas) {
        const touchActions = getAgentTouchActionsByIdAndArea(agentId, area);
        if (touchActions) {
          for (const action of touchActions) {
            await preloadVoice({
              ...agent!.tts,
              message: action.text,
            });
            voiceCount++;
            setVoiceLoadingProgress((voiceCount / totalVoices) * 100);
          }
        }
      }
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
      setLoadingStep(0);
      setVoiceLoadingProgress(0);
      setMotionLoadingProgress(0);
    }
  };

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas, handleTouchArea);
        preloadAgentResources().then(() => {
          if (interactive) {
            // load motion
            speakCharacter(
              {
                expression: VRMExpressionPresetName.Happy,
                tts: {
                  ...agent?.tts,
                  message: agent?.greeting,
                },
                motion: MotionPresetName.FemaleGreeting,
              },
              viewer,
              {
                onComplete: () => {
                  viewer.resetToIdle();
                },
                onError: () => {
                  viewer.resetToIdle();
                  message.error(t('ttsTransformFailed', { ns: 'error' }));
                },
              },
            );
          }
        });

        // Drag and DropでVRMを差し替え
        canvas.addEventListener('dragover', function (event) {
          event.preventDefault();
        });

        canvas.addEventListener('drop', function (event) {
          event.preventDefault();

          const files = event.dataTransfer?.files;
          if (!files) {
            return;
          }

          const file = files[0];
          if (!file) {
            return;
          }

          const file_type = file.name.split('.').pop();
          switch (file_type) {
            case 'vrm': {
              const blob = new Blob([file], { type: 'application/octet-stream' });
              const url = window.URL.createObjectURL(blob);
              viewer.loadVrm(url);

              break;
            }
            case 'fbx': {
              const blob = new Blob([file], { type: 'application/octet-stream' });
              const url = window.URL.createObjectURL(blob);
              viewer.model?.playMotionUrl(MotionFileType.FBX, url);

              break;
            }
            case 'pmx': {
              const blob = new Blob([file], { type: 'application/octet-stream' });
              const url = window.URL.createObjectURL(blob);
              viewer.loadStage(url);
              break;
            }
            case 'vmd': {
              const blob = new Blob([file], { type: 'application/octet-stream' });
              const url = window.URL.createObjectURL(blob);
              viewer.model?.playMotionUrl(MotionFileType.VMD, url);

              break;
            }
            case 'vrma': {
              const blob = new Blob([file], { type: 'application/octet-stream' });
              const url = window.URL.createObjectURL(blob);
              viewer.model?.playMotionUrl(MotionFileType.VRMA, url);
              break;
            }
            // No default
          }
        });
      }
    },
    [viewer, agentId, interactive],
  );

  const handleFullscreen = useCallback(() => {
    if (!ref.current) return;

    if (!document.fullscreenElement) {
      ref.current.requestFullscreen().catch((err) => {
        console.error(`全屏错误: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(`退出全屏错误: ${err.message}`);
      });
    }
  }, []);

  return (
    <div
      ref={ref}
      className={classNames(styles.viewer, className)}
      id="agent-viewer"
      style={{ height, width, ...style }}
    >
      {toolbar && (
        <ToolBar className={styles.toolbar} viewer={viewer} onFullscreen={handleFullscreen} />
      )}
      {loading ? (
        <ScreenLoading
          title={t('loading.waiting')}
          className={styles.loading}
          description={
            loadingStep === 1
              ? `${t('loading.model')} ${modelPercent}%`
              : loadingStep === 2
                ? `${t('loading.motions')} ${Math.round(motionLoadingProgress)}%`
                : loadingStep === 3
                  ? `${t('loading.voices')} ${Math.round(voiceLoadingProgress)}%`
                  : undefined
          }
        />
      ) : null}
      <canvas ref={canvasRef} className={styles.canvas} id={'vrm-canvas'} />
      <Background />
    </div>
  );
}

export default memo(AgentViewer);
