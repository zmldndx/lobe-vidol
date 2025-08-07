import { VirtualHumanController } from './core/VirtualHumanController';
import { GenerationModule } from './modules/GenerationModule';
import { SegmentationModule } from './modules/SegmentationModule';
import { TransitionModule } from './modules/TransitionModule';
import { VirtualHumanConfig } from '@/types/renderStream';

/**
 * 虚拟人控制系统工厂类
 * 负责组装和配置虚拟人控制系统的各个模块
 */
export class VirtualHumanFactory {
  /**
   * 创建虚拟人控制器
   */
  public static createController(config: VirtualHumanConfig): VirtualHumanController {
    const controller = new VirtualHumanController(config);

    // 注册智能断句模块
    const segmentationModule = new SegmentationModule({
      minSegmentLength: 10,
      maxSegmentLength: 100,
      punctuationMarks: ['。', '！', '？', '；', '，', '.', '!', '?', ';', ','],
      emotionKeywords: {
        '开心': 'happy',
        '高兴': 'happy',
        '快乐': 'happy',
        '愤怒': 'angry',
        '生气': 'angry',
        '悲伤': 'sad',
        '难过': 'sad',
        '哭泣': 'cry',
        '惊讶': 'surprised',
        '害怕': 'fear',
        '恐惧': 'fear',
        '厌恶': 'disgust',
        '恶心': 'disgust'
      }
    });

    // 注册渲染流生成模块
    const generationModule = new GenerationModule({
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
      }
    });

    // 注册无缝切换模块
    const transitionModule = new TransitionModule({
      transitionDuration: 300,
      enableSmoothTransition: true,
      enableCrossFade: true,
      transitionThreshold: 0.5
    });

    // 注册模块到控制器
    controller.registerModule('segmentation', segmentationModule);
    controller.registerModule('generation', generationModule);
    controller.registerModule('transition', transitionModule);

    return controller;
  }

  /**
   * 创建默认配置的虚拟人控制器
   */
  public static createDefaultController(): VirtualHumanController {
    const defaultConfig: VirtualHumanConfig = {
      enableSmartSegmentation: true,
      enableSeamlessTransition: false, // 暂时禁用无缝切换
      enableEmotionAnalysis: true,
      defaultExpression: 'neutral',
      defaultMotion: ['idle'],
      defaultCamera: '智能镜头'
    };

    return this.createController(defaultConfig);
  }

  /**
   * 创建高性能配置的虚拟人控制器
   */
  public static createHighPerformanceController(): VirtualHumanController {
    const highPerfConfig: VirtualHumanConfig = {
      enableSmartSegmentation: true,
      enableSeamlessTransition: true,
      enableEmotionAnalysis: true,
      defaultExpression: 'neutral',
      defaultMotion: ['idle'],
      defaultCamera: '智能镜头'
    };

    const controller = this.createController(highPerfConfig);
    
    // 配置高性能参数
    const transitionModule = controller.getModule<TransitionModule>('transition');
    if (transitionModule) {
      // 可以在这里调整高性能参数
    }

    return controller;
  }

  /**
   * 创建自定义配置的虚拟人控制器
   */
  public static createCustomController(
    config: Partial<VirtualHumanConfig>,
    customModules?: Record<string, any>
  ): VirtualHumanController {
    const defaultConfig: VirtualHumanConfig = {
      enableSmartSegmentation: true,
      enableSeamlessTransition: true,
      enableEmotionAnalysis: true,
      defaultExpression: 'neutral',
      defaultMotion: ['idle'],
      defaultCamera: '智能镜头'
    };

    const finalConfig = { ...defaultConfig, ...config };
    const controller = this.createController(finalConfig);

    // 注册自定义模块
    if (customModules) {
      Object.entries(customModules).forEach(([name, module]) => {
        controller.registerModule(name, module);
      });
    }

    return controller;
  }
} 