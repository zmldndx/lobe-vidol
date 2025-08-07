import { VirtualHumanController } from '../core/VirtualHumanController';
import { RenderStream } from '@/types/renderStream';
import { Viewer } from '@/libs/vrmViewer/viewer';
import { speakCharacter } from '@/libs/messages/speakCharacter';
import { VRMExpressionPresetName } from '@pixiv/three-vrm';
import { MotionPresetName } from '@/libs/emoteController/motionPresetMap';
import { sessionSelectors, useSessionStore } from '@/store/session';
import { DEFAULT_TTS_CONFIG_FEMALE } from '@/constants/tts';

/**
 * Camera模式适配器
 * 将虚拟人控制系统集成到现有的camera模式中
 */
export class CameraModeAdapter {
  private controller: VirtualHumanController;
  private viewer: Viewer;
  private isProcessing: boolean = false;
  private processedStreamIds: Set<string> = new Set();

  constructor(controller: VirtualHumanController, viewer: Viewer) {
    this.controller = controller;
    this.viewer = viewer;
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听渲染流就绪事件
    this.controller.on('renderStreamReady', (renderStream: RenderStream) => {
      this.handleRenderStream(renderStream);
    });

    // 监听状态变化事件
    this.controller.on('stateChanged', ({ oldState, newState }) => {
      console.log(`虚拟人控制状态变化: ${oldState} -> ${newState}`);
    });

    // 监听错误事件
    this.controller.on('error', ({ error, context }) => {
      console.error(`虚拟人控制错误 [${context}]:`, error);
    });
  }

  /**
   * 处理AI流式回复
   */
  public async handleAIResponse(text: string): Promise<void> {
    if (this.isProcessing) {
      console.warn('适配器: 正在处理中，跳过新的AI回复');
      return;
    }

    try {
      this.isProcessing = true;
      // 清理已处理的流ID，避免内存泄漏
      if (this.processedStreamIds.size > 100) {
        this.processedStreamIds.clear();
        console.log('适配器: 清理已处理的流ID缓存');
      }

      console.log('适配器: 开始处理AI回复', {
        textLength: text.length,
        textPreview: text.slice(0, 100) + '...',
        hasController: !!this.controller,
        hasViewer: !!this.viewer
      });

      await this.controller.processAIResponse(text);
    } catch (error) {
      console.error('适配器: 处理AI回复失败:', error);
      // 确保在出错时重置处理状态
      this.isProcessing = false;
      throw error;
    } finally {
      this.isProcessing = false;
      console.log('适配器: AI回复处理完成');
    }
  }

  /**
   * 处理渲染流
   */
  private async handleRenderStream(renderStream: RenderStream): Promise<void> {
    // 检查是否已经处理过这个渲染流
    if (this.processedStreamIds.has(renderStream.streamId)) {
      console.log('适配器: 跳过已处理的渲染流', { streamId: renderStream.streamId });
      return;
    }

    // 标记为已处理
    this.processedStreamIds.add(renderStream.streamId);

    try {
      console.log('适配器: 开始处理渲染流', {
        streamId: renderStream.streamId,
        expression: renderStream.expression,
        motion: renderStream.motion,
        camera: renderStream.camera,
        text: renderStream.text?.slice(0, 50) + '...'
      });

      // 1. 处理表情
      if (renderStream.expression) {
        console.log('适配器: 处理表情', { expression: renderStream.expression });
        await this.handleExpression(renderStream.expression);
      }

      // 2. 处理动作
      if (renderStream.motion && renderStream.motion.length > 0) {
        console.log('适配器: 处理动作', { motion: renderStream.motion[0] });
        await this.handleMotion(renderStream.motion[0]);
      }

      // 3. 处理相机
      if (renderStream.camera) {
        console.log('适配器: 处理相机', { camera: renderStream.camera });
        await this.handleCamera(renderStream.camera);
      }

      // 4. 处理场景和背景
      if (renderStream.scene || renderStream.background) {
        console.log('适配器: 处理场景和背景', { 
          scene: renderStream.scene, 
          background: renderStream.background 
        });
        await this.handleSceneAndBackground(renderStream.scene, renderStream.background);
      }

      // 5. 处理语音和文本
      if (renderStream.text) {
        console.log('适配器: 处理语音和文本', { 
          text: renderStream.text.slice(0, 50) + '...' 
        });
        await this.handleSpeech(renderStream);
      }

      console.log('适配器: 渲染流处理完成');

    } catch (error) {
      console.error('适配器: 处理渲染流失败:', error);
    }
  }

  /**
   * 处理表情
   */
  private async handleExpression(expression: string): Promise<void> {
    if (!this.viewer.model?.emoteController) return;

    // 映射表情名称到VRM表情
    const vrmExpression = this.mapExpressionToVRM(expression);
    this.viewer.model.emoteController.playEmotion(vrmExpression);
  }

  /**
   * 处理动作
   */
  private async handleMotion(motion: string): Promise<void> {
    if (!this.viewer.model?.emoteController) return;

    // 映射动作名称到VRM动作
    const vrmMotion = this.mapMotionToVRM(motion);
    this.viewer.model.emoteController.playMotion(vrmMotion, false);
  }

  /**
   * 处理相机
   */
  private async handleCamera(camera: string): Promise<void> {
    // 这里可以调用viewer的相机控制方法
    // 例如: this.viewer.setCameraMode(camera);
    console.log('设置相机模式:', camera);
  }

  /**
   * 处理场景和背景
   */
  private async handleSceneAndBackground(scene?: string, background?: string): Promise<void> {
    if (scene) {
      // 加载场景
      // this.viewer.loadScene(scene);
      console.log('加载场景:', scene);
    }

    if (background) {
      // 设置背景
      // this.viewer.setBackground(background);
      console.log('设置背景:', background);
    }
  }

  /**
   * 处理语音和文本
   */
  private async handleSpeech(renderStream: RenderStream): Promise<void> {
    try {
      if (!renderStream.text || !this.viewer?.model) {
        console.log('适配器: 跳过语音处理', { 
          hasText: !!renderStream.text, 
          hasModel: !!this.viewer?.model 
        });
        return;
      }

      console.log('适配器: 开始处理语音', { 
        text: renderStream.text.substring(0, 50) + '...' 
      });

      // 尝试播放语音，但不让错误影响整个流程
      try {
        // 获取当前代理的TTS配置
        const currentAgent = sessionSelectors.currentAgent(useSessionStore.getState());
        const ttsConfig = currentAgent?.tts || DEFAULT_TTS_CONFIG_FEMALE;
        
        console.log('适配器: TTS配置', {
          ttsConfig,
          text: renderStream.text,
          hasViewer: !!this.viewer,
          hasModel: !!this.viewer?.model
        });
        
        await speakCharacter(
          {
            expression: this.mapExpressionToVRM(renderStream.expression || 'neutral'),
            tts: {
              ...ttsConfig,
              message: renderStream.text,
            },
            motion: renderStream.motion && renderStream.motion.length > 0 
              ? this.mapMotionToVRM(renderStream.motion[0])
              : MotionPresetName.Idle
          },
          this.viewer,
          {
            onStart: () => {
              console.log('适配器: 语音播放开始');
            },
            onComplete: () => {
              console.log('适配器: 语音播放完成');
            },
            onError: (error) => {
              console.warn('适配器: 语音播放失败，但不影响其他功能', error);
              // 不抛出错误，让流程继续
            }
          }
        );
      } catch (error) {
        console.warn('适配器: 语音处理失败，但不影响其他功能', error);
        // 不抛出错误，让流程继续
      }

    } catch (error) {
      console.error('适配器: 处理语音和文本失败:', error);
      // 不抛出错误，让流程继续
    }
  }

  /**
   * 映射表情到VRM表情
   */
  private mapExpressionToVRM(expression: string): VRMExpressionPresetName {
    const expressionMap: Record<string, VRMExpressionPresetName> = {
      'smile': VRMExpressionPresetName.Happy,
      'happy': VRMExpressionPresetName.Happy,
      'angry': VRMExpressionPresetName.Angry,
      'sad': VRMExpressionPresetName.Sad,
      'cry': VRMExpressionPresetName.Sad,
      'surprised': VRMExpressionPresetName.Surprised,
      'fear': VRMExpressionPresetName.Surprised,
      'disgust': VRMExpressionPresetName.Angry,
      'neutral': VRMExpressionPresetName.Neutral
    };

    return expressionMap[expression] || VRMExpressionPresetName.Neutral;
  }

  /**
   * 映射动作到VRM动作
   */
  private mapMotionToVRM(motion: string): MotionPresetName {
    const motionMap: Record<string, MotionPresetName> = {
      'wave': MotionPresetName.FemaleGreeting,
      'dance': MotionPresetName.FemaleAppeal,
      'fist': MotionPresetName.FemaleAngry,
      'point': MotionPresetName.FemaleGreeting,
      'head_down': MotionPresetName.FemaleStand,
      'sigh': MotionPresetName.FemaleStand,
      'cry': MotionPresetName.FemaleStand,
      'wipe_tears': MotionPresetName.FemaleStand,
      'jump': MotionPresetName.FemaleHappy,
      'hands_up': MotionPresetName.FemaleHappy,
      'shrink': MotionPresetName.FemaleStand,
      'cover_face': MotionPresetName.FemaleCoverChest,
      'turn_away': MotionPresetName.FemaleStand,
      'cover_nose': MotionPresetName.FemaleStand,
      'idle': MotionPresetName.Idle,
      'look_around': MotionPresetName.Idle
    };

    return motionMap[motion] || MotionPresetName.Idle;
  }

  /**
   * 获取控制器
   */
  public getController(): VirtualHumanController {
    return this.controller;
  }

  /**
   * 销毁适配器
   */
  public destroy(): void {
    this.controller.removeAllListeners();
    this.isProcessing = false;
  }
} 