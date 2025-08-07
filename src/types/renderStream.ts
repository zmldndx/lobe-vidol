/**
 * 虚拟人渲染流协议类型定义
 */

export interface RenderStream {
  /** 音频数据 (base64编码) */
  audio?: string;
  /** 背景图片 */
  background?: string;
  /** 相机模式 */
  camera?: '空' | '智能镜头' | '跟踪-大脸' | '跟踪-背向' | '跟踪-朝向';
  /** 表情类型 */
  expression?: 'smile' | 'angry' | 'cry' | 'neutral' | 'happy' | 'sad' | 'surprised' | 'fear' | 'disgust';
  /** 动作列表 */
  motion?: string[];
  /** 场景名称 */
  scene?: string;
  /** 流ID */
  streamId?: string;
  /** 文本内容 */
  text?: string;
  /** 时间戳 */
  timestamp?: number;
}

/**
 * 渲染流历史记录
 */
export interface RenderStreamHistory {
  currentIndex: number;
  maxHistory: number;
  streams: RenderStream[];
}

/**
 * 智能断句结果
 */
export interface SentenceSegment {
  emotion?: string;
  emphasis?: boolean;
  pause?: number;
  text: string;
}

/**
 * 状态机状态
 */
export enum RenderStreamState {
  ERROR = 'error',
  IDLE = 'idle',
  PROCESSING = 'processing',
  RENDERING = 'rendering',
  TRANSITIONING = 'transitioning'
}

/**
 * 虚拟人控制配置
 */
export interface VirtualHumanConfig {
  /** 相机模式 */
  defaultCamera: string;
  /** 默认表情 */
  defaultExpression: string;
  /** 默认动作 */
  defaultMotion: string[];
  /** 是否启用情感分析 */
  enableEmotionAnalysis: boolean;
  /** 是否启用无缝切换 */
  enableSeamlessTransition: boolean;
  /** 是否启用智能断句 */
  enableSmartSegmentation: boolean;
} 