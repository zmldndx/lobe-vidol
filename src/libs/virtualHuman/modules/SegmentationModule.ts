import { SentenceSegment } from '@/types/renderStream';

/**
 * 智能断句模块接口
 */
export interface ISegmentationModule {
  segment(text: string): Promise<SentenceSegment[]>;
}

/**
 * 智能断句模块实现
 */
export class SegmentationModule implements ISegmentationModule {
  private config: {
    minSegmentLength: number;
    maxSegmentLength: number;
    punctuationMarks: string[];
    emotionKeywords: Record<string, string>;
  };

  constructor(config?: Partial<SegmentationModule['config']>) {
    this.config = {
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
      },
      ...config
    };
  }

  /**
   * 智能断句
   */
  public async segment(text: string): Promise<SentenceSegment[]> {
    const segments: SentenceSegment[] = [];
    let currentSegment = '';
    let currentEmotion = 'neutral';

    // 按句子分割
    const sentences = this.splitIntoSentences(text);

    for (const sentence of sentences) {
      // 分析情感
      const emotion = this.analyzeEmotion(sentence);
      
      // 检查是否需要分割长句
      if (sentence.length > this.config.maxSegmentLength) {
        const subSegments = this.splitLongSentence(sentence, emotion);
        segments.push(...subSegments);
      } else {
        segments.push({
          text: sentence,
          emotion,
          emphasis: this.hasEmphasis(sentence),
          pause: this.calculatePause(sentence)
        });
      }
    }

    return segments;
  }

  /**
   * 按句子分割文本
   */
  private splitIntoSentences(text: string): string[] {
    // 使用正则表达式分割句子
    const sentenceRegex = /[^。！？；\n]+[。！？；\n]*/g;
    const sentences = text.match(sentenceRegex) || [];
    
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * 分析情感
   */
  private analyzeEmotion(text: string): string {
    const lowerText = text.toLowerCase();
    
    for (const [keyword, emotion] of Object.entries(this.config.emotionKeywords)) {
      if (lowerText.includes(keyword)) {
        return emotion;
      }
    }

    // 基于标点符号的简单情感分析
    if (text.includes('！') || text.includes('!')) {
      return 'surprised';
    }
    if (text.includes('？') || text.includes('?')) {
      return 'surprised';
    }

    return 'neutral';
  }

  /**
   * 分割长句
   */
  private splitLongSentence(sentence: string, emotion: string): SentenceSegment[] {
    const segments: SentenceSegment[] = [];
    const words = sentence.split('');
    let currentSegment = '';
    
    for (const word of words) {
      currentSegment += word;
      
      // 在标点符号处分割
      if (this.config.punctuationMarks.includes(word) && currentSegment.length >= this.config.minSegmentLength) {
        segments.push({
          text: currentSegment,
          emotion,
          emphasis: this.hasEmphasis(currentSegment),
          pause: this.calculatePause(currentSegment)
        });
        currentSegment = '';
      }
    }
    
    // 处理剩余部分
    if (currentSegment.trim()) {
      segments.push({
        text: currentSegment,
        emotion,
        emphasis: this.hasEmphasis(currentSegment),
        pause: this.calculatePause(currentSegment)
      });
    }
    
    return segments;
  }

  /**
   * 检查是否有强调
   */
  private hasEmphasis(text: string): boolean {
    return text.includes('**') || text.includes('__') || text.includes('！') || text.includes('!');
  }

  /**
   * 计算停顿时间
   */
  private calculatePause(text: string): number {
    let pause = 0;
    
    // 根据标点符号计算停顿
    for (const mark of this.config.punctuationMarks) {
      // 转义特殊字符，避免正则表达式错误
      const escapedMark = mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const count = (text.match(new RegExp(escapedMark, 'g')) || []).length;
      if (mark === '。' || mark === '.') pause += count * 500;
      else if (mark === '！' || mark === '!') pause += count * 300;
      else if (mark === '？' || mark === '?') pause += count * 400;
      else if (mark === '；' || mark === ';') pause += count * 200;
      else if (mark === '，' || mark === ',') pause += count * 100;
    }
    
    return pause;
  }
} 