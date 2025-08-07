import { EventEmitter } from 'events';

import { RenderStream, RenderStreamHistory, RenderStreamState, VirtualHumanConfig } from '@/types/renderStream';

/**
 * 虚拟人控制器核心类
 * 负责协调各个模块，实现高内聚低耦合的架构
 */
export class VirtualHumanController extends EventEmitter {
  private state: RenderStreamState = RenderStreamState.IDLE;
  private history: RenderStreamHistory;
  private config: VirtualHumanConfig;
  private modules: Map<string, any> = new Map();

  constructor(config: VirtualHumanConfig) {
    super();
    this.config = config;
    this.history = {
      streams: [],
      currentIndex: -1,
      maxHistory: 50
    };
  }

  /**
   * 注册模块
   */
  public registerModule(name: string, module: any): void {
    this.modules.set(name, module);
    this.emit('moduleRegistered', { name, module });
  }

  /**
   * 获取模块
   */
  public getModule<T>(name: string): T | undefined {
    return this.modules.get(name) as T;
  }

  /**
   * 设置状态
   */
  private setState(newState: RenderStreamState): void {
    const oldState = this.state;
    this.state = newState;
    this.emit('stateChanged', { oldState, newState });
  }

  /**
   * 获取当前状态
   */
  public getState(): RenderStreamState {
    return this.state;
  }

  /**
   * 获取配置
   */
  public getConfig(): VirtualHumanConfig {
    return this.config;
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<VirtualHumanConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * 添加渲染流到历史记录
   */
  private addToHistory(stream: RenderStream): void {
    this.history.streams.push(stream);
    this.history.currentIndex = this.history.streams.length - 1;
    
    // 限制历史记录数量
    if (this.history.streams.length > this.history.maxHistory) {
      this.history.streams.shift();
      this.history.currentIndex--;
    }
  }

  /**
   * 获取历史记录
   */
  public getHistory(): RenderStreamHistory {
    return { ...this.history };
  }

  /**
   * 清空历史记录
   */
  public clearHistory(): void {
    this.history.streams = [];
    this.history.currentIndex = -1;
    this.emit('historyCleared');
  }

  /**
   * 处理AI流式回复
   */
  public async processAIResponse(text: string): Promise<void> {
    try {
      console.log('虚拟人控制器: 开始处理AI回复', {
        textLength: text.length,
        textPreview: text.substring(0, 100) + '...',
        currentState: this.state
      });

      this.setState(RenderStreamState.PROCESSING);
      this.emit('aiResponseReceived', { text });

      // 1. 智能断句
      console.log('虚拟人控制器: 开始智能断句');
      const segments = await this.segmentText(text);
      console.log('虚拟人控制器: 断句完成', {
        segmentCount: segments.length,
        segments: segments.map(s => ({ text: s.text.substring(0, 30) + '...', emotion: s.emotion }))
      });
      
      // 2. 为每个段落生成渲染流
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        console.log(`虚拟人控制器: 生成渲染流 ${i + 1}/${segments.length}`, {
          segmentText: segment.text.substring(0, 50) + '...',
          emotion: segment.emotion
        });

        const renderStream = await this.generateRenderStream(segment);
        console.log('虚拟人控制器: 渲染流生成完成', {
          streamId: renderStream.streamId,
          expression: renderStream.expression,
          motion: renderStream.motion,
          camera: renderStream.camera
        });
        
        // 3. 添加到历史记录
        this.addToHistory(renderStream);
        
        // 4. 触发无缝切换
        await this.triggerSeamlessTransition(renderStream);
      }

      this.setState(RenderStreamState.IDLE);
      this.emit('aiResponseProcessed', { text, segments });
      console.log('虚拟人控制器: AI回复处理完成', {
        totalSegments: segments.length,
        finalState: this.state
      });
    } catch (error) {
      console.error('虚拟人控制器: 处理AI回复失败', error);
      this.setState(RenderStreamState.ERROR);
      this.emit('error', { error, context: 'processAIResponse' });
      
      // 延迟重置状态，避免立即重试
      setTimeout(() => {
        if (this.state === RenderStreamState.ERROR) {
          console.log('虚拟人控制器: 重置错误状态');
          this.setState(RenderStreamState.IDLE);
        }
      }, 5000);
      
      throw error;
    }
  }

  /**
   * 智能断句
   */
  private async segmentText(text: string): Promise<any[]> {
    const segmentationModule = this.getModule<{ segment: (text: string) => Promise<any[]> }>('segmentation');
    if (segmentationModule && this.config.enableSmartSegmentation) {
      return await segmentationModule.segment(text);
    }
    
    // 默认简单断句
    return [{ text, emotion: 'neutral', emphasis: false, pause: 0 }];
  }

  /**
   * 生成渲染流
   */
  private async generateRenderStream(segment: any): Promise<RenderStream> {
    const generationModule = this.getModule<{ generate: (segment: any, history: RenderStreamHistory) => Promise<RenderStream> }>('generation');
    if (generationModule) {
      return await generationModule.generate(segment, this.history);
    }
    
    // 默认渲染流
    return {
      text: segment.text,
      expression: (segment.emotion || this.config.defaultExpression) as RenderStream['expression'],
      motion: this.config.defaultMotion,
      camera: this.config.defaultCamera as RenderStream['camera'],
      timestamp: Date.now(),
      streamId: this.generateStreamId()
    };
  }

  /**
   * 触发无缝切换
   */
  private async triggerSeamlessTransition(renderStream: RenderStream): Promise<void> {
    console.log('虚拟人控制器: 触发无缝切换', {
      streamId: renderStream.streamId,
      expression: renderStream.expression,
      motion: renderStream.motion,
      camera: renderStream.camera,
      enableSeamlessTransition: this.config.enableSeamlessTransition
    });

    if (!this.config.enableSeamlessTransition) {
      console.log('虚拟人控制器: 直接触发renderStreamReady事件');
      this.emit('renderStreamReady', renderStream);
      return;
    }

    const transitionModule = this.getModule<{ transition: (renderStream: RenderStream, history: RenderStreamHistory) => Promise<void> }>('transition');
    if (transitionModule) {
      this.setState(RenderStreamState.TRANSITIONING);
      await transitionModule.transition(renderStream, this.history);
      this.setState(RenderStreamState.RENDERING);
    }

    console.log('虚拟人控制器: 触发renderStreamReady事件');
    this.emit('renderStreamReady', renderStream);
  }

  /**
   * 生成流ID
   */
  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁控制器
   */
  public destroy(): void {
    this.removeAllListeners();
    this.modules.clear();
    this.clearHistory();
  }
} 