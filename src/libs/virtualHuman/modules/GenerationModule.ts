import { RenderStream, RenderStreamHistory, SentenceSegment } from '@/types/renderStream';

/**
 * 渲染流生成模块接口
 */
export interface IGenerationModule {
  generate(segment: SentenceSegment, history: RenderStreamHistory): Promise<RenderStream>;
}

/**
 * 渲染流生成模块实现
 */
export class GenerationModule implements IGenerationModule {
  private config: {
    defaultExpression: string;
    defaultMotion: string[];
    defaultCamera: '空' | '智能镜头' | '跟踪-大脸' | '跟踪-背向' | '跟踪-朝向';
    emotionToExpression: Record<string, string>;
    emotionToMotion: Record<string, string[]>;
  };

  constructor(config?: Partial<GenerationModule['config']>) {
    this.config = {
      defaultExpression: 'neutral',
      defaultMotion: ['idle'],
      defaultCamera: '智能镜头',
      emotionToExpression: {
        'happy': 'smile',
        'angry': 'angry',
        'sad': 'sad',
        'cry': 'cry',
        'surprised': 'surprised',
        'fear': 'fear',
        'disgust': 'disgust',
        'neutral': 'neutral'
      },
      emotionToMotion: {
        'happy': ['wave', 'dance'],
        'angry': ['fist', 'point'],
        'sad': ['head_down', 'sigh'],
        'cry': ['cry', 'wipe_tears'],
        'surprised': ['jump', 'hands_up'],
        'fear': ['shrink', 'cover_face'],
        'disgust': ['turn_away', 'cover_nose'],
        'neutral': ['idle', 'look_around']
      },
      ...config
    };
  }

  /**
   * 生成渲染流
   */
  public async generate(segment: SentenceSegment, history: RenderStreamHistory): Promise<RenderStream> {
    // 分析情感并映射到表情和动作
    const expression = this.mapEmotionToExpression(segment.emotion || 'neutral');
    const motion = this.mapEmotionToMotion(segment.emotion || 'neutral');
    
    // 智能相机控制
    const camera = this.determineCameraMode(segment, history);
    
    // 生成音频（这里可以集成TTS服务）
    const audio = await this.generateAudio(segment.text);
    
    // 确定场景和背景
    const scene = this.determineScene(segment, history);
    const background = this.determineBackground(segment, history);

    return {
      text: segment.text,
      audio,
      expression,
      motion,
      camera,
      scene,
      background,
      timestamp: Date.now(),
      streamId: this.generateStreamId()
    };
  }

  /**
   * 映射情感到表情
   */
  private mapEmotionToExpression(emotion: string): RenderStream['expression'] {
    const expression = this.config.emotionToExpression[emotion] || this.config.defaultExpression;
    return expression as RenderStream['expression'];
  }

  /**
   * 映射情感到动作
   */
  private mapEmotionToMotion(emotion: string): string[] {
    const motions = this.config.emotionToMotion[emotion] || this.config.defaultMotion;
    // 随机选择一个动作，避免重复
    const randomMotion = motions[Math.floor(Math.random() * motions.length)];
    return [randomMotion];
  }

  /**
   * 确定相机模式
   */
  private determineCameraMode(segment: SentenceSegment, history: RenderStreamHistory): '空' | '智能镜头' | '跟踪-大脸' | '跟踪-背向' | '跟踪-朝向' {
    // 基于情感和强调程度选择相机模式
    if (segment.emphasis) {
      return '跟踪-大脸';
    }
    
    if (segment.emotion === 'surprised' || segment.emotion === 'fear') {
      return '跟踪-朝向';
    }
    
    if (segment.emotion === 'sad' || segment.emotion === 'cry') {
      return '跟踪-背向';
    }
    
    // 检查历史记录中的相机模式，避免频繁切换
    const recentStreams = history.streams.slice(-3);
    const lastCamera = recentStreams[recentStreams.length - 1]?.camera;
    
    if (lastCamera && lastCamera !== '空') {
      return lastCamera;
    }
    
    return this.config.defaultCamera;
  }

  /**
   * 生成音频
   */
  private async generateAudio(text: string): Promise<string | undefined> {
    try {
      // 这里可以集成TTS服务
      // 暂时返回undefined，实际实现时需要调用TTS API
      return undefined;
    } catch (error) {
      console.error('音频生成失败:', error);
      return undefined;
    }
  }

  /**
   * 确定场景
   */
  private determineScene(segment: SentenceSegment, history: RenderStreamHistory): string | undefined {
    // 基于文本内容或历史记录确定场景
    const text = segment.text.toLowerCase();
    
    if (text.includes('办公室') || text.includes('工作')) {
      return 'office';
    }
    if (text.includes('家') || text.includes('房间')) {
      return 'home';
    }
    if (text.includes('公园') || text.includes('户外')) {
      return 'park';
    }
    if (text.includes('舞台') || text.includes('表演')) {
      return 'stage';
    }
    
    // 使用最近的场景
    const recentStreams = history.streams.slice(-5);
    const lastScene = recentStreams.find(s => s.scene)?.scene;
    return lastScene || 'default';
  }

  /**
   * 确定背景
   */
  private determineBackground(segment: SentenceSegment, history: RenderStreamHistory): string | undefined {
    // 基于情感和场景确定背景
    const emotion = segment.emotion || 'neutral';
    
    if (emotion === 'happy') {
      return 'bright_bg';
    }
    if (emotion === 'sad' || emotion === 'cry') {
      return 'dark_bg';
    }
    if (emotion === 'fear') {
      return 'mysterious_bg';
    }
    
    return 'neutral_bg';
  }

  /**
   * 生成流ID
   */
  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 