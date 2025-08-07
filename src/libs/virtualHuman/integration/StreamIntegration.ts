import { VirtualHumanController } from '../core/VirtualHumanController';
import { CameraModeAdapter } from '../adapters/CameraModeAdapter';
import { RenderStream } from '@/types/renderStream';

/**
 * 流式集成管理器
 * 将虚拟人控制系统集成到AI流式处理流程中
 */
export class StreamIntegration {
  private controller: VirtualHumanController;
  private adapter: CameraModeAdapter;
  private accumulatedText = '';
  private isProcessing = false;
  private sentenceBuffer = '';
  private lastProcessedLength = 0;

  constructor(controller: VirtualHumanController, adapter: CameraModeAdapter) {
    this.controller = controller;
    this.adapter = adapter;
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听渲染流就绪事件
    this.controller.on('renderStreamReady', (renderStream: RenderStream) => {
      console.log('虚拟人渲染流就绪:', renderStream);
    });

    // 监听状态变化
    this.controller.on('stateChanged', ({ oldState, newState }) => {
      console.log(`虚拟人控制状态: ${oldState} -> ${newState}`);
    });
  }

  /**
   * 处理AI流式文本块
   * 这是主要的集成点，在AI流式返回过程中调用
   */
  public async handleStreamChunk(chunk: string): Promise<void> {
    if (this.isProcessing) {
      // 如果正在处理，将文本累积到缓冲区
      this.sentenceBuffer += chunk;
      return;
    }

    this.accumulatedText += chunk;
    this.sentenceBuffer += chunk;

    // 检查是否有完整的句子
    const sentences = this.extractCompleteSentences(this.sentenceBuffer);
    
    if (sentences.length > 0) {
      await this.processSentences(sentences);
      // 更新已处理的长度
      this.lastProcessedLength = this.accumulatedText.length;
    }
  }

  /**
   * 处理AI流式文本完成
   * 在AI流式处理完成时调用
   */
  public async handleStreamComplete(): Promise<void> {
    // 处理剩余的文本
    if (this.sentenceBuffer.length > 0) {
      await this.processSentences([this.sentenceBuffer]);
      this.sentenceBuffer = '';
    }

    // 重置状态
    this.accumulatedText = '';
    this.lastProcessedLength = 0;
    this.isProcessing = false;
  }

  /**
   * 提取完整句子
   */
  private extractCompleteSentences(text: string): string[] {
    // 使用正则表达式匹配句子结束标记
    const sentenceRegex = /[^。！？；\n]+[。！？；\n]*/g;
    const matches = text.match(sentenceRegex) || [];
    
    const sentences: string[] = [];
    let remainingText = text;

    for (const match of matches) {
      if (match.trim()) {
        sentences.push(match.trim());
        remainingText = remainingText.replace(match, '');
      }
    }

    // 更新缓冲区为剩余文本
    this.sentenceBuffer = remainingText;

    return sentences;
  }

  /**
   * 处理句子列表
   */
  private async processSentences(sentences: string[]): Promise<void> {
    if (sentences.length === 0) return;

    this.isProcessing = true;

    try {
      for (const sentence of sentences) {
        // 跳过空白句子
        if (!sentence.trim()) continue;

        // 使用虚拟人控制器处理句子
        await this.adapter.handleAIResponse(sentence);
        
        // 添加小延迟，避免过于频繁的处理
        await this.delay(100);
      }
    } catch (error) {
      console.error('处理句子失败:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取当前状态
   */
  public getStatus() {
    return {
      accumulatedText: this.accumulatedText,
      sentenceBuffer: this.sentenceBuffer,
      isProcessing: this.isProcessing,
      lastProcessedLength: this.lastProcessedLength
    };
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.accumulatedText = '';
    this.sentenceBuffer = '';
    this.isProcessing = false;
    this.lastProcessedLength = 0;
  }
} 