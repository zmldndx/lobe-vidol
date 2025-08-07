import React, { memo, useEffect, useRef } from 'react';
import { useVirtualHumanController } from '@/hooks/useVirtualHumanController';
import { useGlobalStore } from '@/store/global';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';

/**
 * 智能断句工具
 */
class SmartSentenceSegmenter {
  private sentenceBuffer = '';
  private lastProcessedContent = '';
  private punctuationMarks = ['。', '！', '？', '；', '，', '.', '!', '?', ';', ','];

  /**
   * 处理新的文本内容，返回需要处理的完整句子
   */
  public processNewContent(content: string): string[] {
    // 如果内容没有变化，直接返回空数组
    if (content === this.lastProcessedContent) {
      return [];
    }

    // 检查内容是否只是变短了（可能是用户删除了内容）
    if (content.length < this.lastProcessedContent.length) {
      console.log('智能断句器: 检测到内容缩短，重置状态');
      this.reset();
      this.lastProcessedContent = content;
      return [];
    }

    // 获取新增的内容
    const newContent = content.slice(this.lastProcessedContent.length);
    if (newContent.length === 0) {
      return [];
    }

    this.sentenceBuffer += newContent;
    this.lastProcessedContent = content;

    // 提取完整句子
    return this.extractCompleteSentences();
  }

  /**
   * 提取完整句子
   * 使用与TTS相同的断句逻辑
   */
  private extractCompleteSentences(): string[] {
    const sentences: string[] = [];
    
    // 使用与TTS相同的断句正则表达式
    // 匹配以换行符、句号、感叹号、问号结尾的句子，或者长度超过10个字符且以逗号、顿号结尾的片段
    const sentenceMatch = this.sentenceBuffer.match(/^(.+[\n~。！．？]|.{10,}[,、])/);
    
    if (sentenceMatch && sentenceMatch[0]) {
      const sentence = sentenceMatch[0];
      sentences.push(sentence);
      this.sentenceBuffer = this.sentenceBuffer.slice(sentence.length).trimStart();
    }

    return sentences;
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.sentenceBuffer = '';
    this.lastProcessedContent = '';
  }

  /**
   * 获取当前状态
   */
  public getStatus() {
    return {
      sentenceBuffer: this.sentenceBuffer,
      lastProcessedContent: this.lastProcessedContent
    };
  }

  /**
   * 获取剩余的未处理文本
   */
  public getRemainingText(): string {
    return this.sentenceBuffer;
  }
}

/**
 * 虚拟人控制系统集成组件
 * 在camera模式中提供虚拟人智能控制功能
 */
const VirtualHumanIntegration = memo(() => {
  const viewer = useGlobalStore((s) => s.viewer);
  const {
    handleAIResponse,
    getControllerState
  } = useVirtualHumanController(viewer);

  const { state, isProcessing, currentStream, hasController } = getControllerState();
  
  // 获取当前会话状态
  const currentChats = useSessionStore((s) => sessionSelectors.currentChats(s));
  const chatLoadingId = useSessionStore((s) => s.chatLoadingId);

  // 智能断句器
  const segmenterRef = useRef<SmartSentenceSegmenter>(new SmartSentenceSegmenter());

  // 监听AI回复处理完成事件
  useEffect(() => {
    if (!hasController || !viewer || isProcessing) {
      return;
    }

    // 获取最新的AI消息
    const lastAssistantMessage = currentChats
      .findLast(msg => msg.role === 'assistant');

    if (!lastAssistantMessage || !lastAssistantMessage.content) {
      return;
    }

    // 检查是否是正在加载中的消息，避免处理用户输入
    if (lastAssistantMessage.content === '...' || lastAssistantMessage.content.trim() === '') {
      return;
    }

    // 使用智能断句器处理新内容
    const sentences = segmenterRef.current.processNewContent(lastAssistantMessage.content);
    
    if (sentences.length > 0) {
      console.log('虚拟人集成: 发现新的完整句子，开始处理', {
        sentences: sentences.map(s => s.slice(0, 30) + '...'),
        sentenceCount: sentences.length
      });
      
      // 处理每个完整句子
      sentences.forEach(async (sentence) => {
        try {
          // 只处理虚拟人控制，TTS播放由CameraModeAdapter处理
          await handleAIResponse(sentence);
        } catch (error) {
          console.error('虚拟人集成: 处理句子失败', error);
        }
      });
    }
  }, [currentChats, isProcessing, hasController, viewer]);

  // 监听render_stream变化
  useEffect(() => {
    if (currentStream) {
      console.log('虚拟人集成: 收到新的render_stream', {
        streamId: currentStream.streamId,
        expression: currentStream.expression,
        motion: currentStream.motion,
        camera: currentStream.camera,
        text: currentStream.text?.slice(0, 50) + '...'
      });
    }
  }, [currentStream]);

  // 监听状态变化，重置处理状态
  useEffect(() => {
    if (state === 'error') {
      console.log('虚拟人集成: 检测到错误状态，重置处理状态');
      segmenterRef.current.reset();
    }
  }, [state]);

  // 监听聊天加载状态变化，重置断句器
  useEffect(() => {
    if (chatLoadingId) {
      console.log('虚拟人集成: 检测到新的聊天开始，重置断句器');
      segmenterRef.current.reset();
    }
  }, [chatLoadingId]);

  // 监听聊天完成，处理剩余文本
  useEffect(() => {
    if (!chatLoadingId && hasController && !isProcessing) {
      const lastAssistantMessage = currentChats.findLast(msg => msg.role === 'assistant');
      
      // 当没有正在加载且最后一条消息存在时，处理剩余的文本
      if (lastAssistantMessage?.content) {
        const remainingText = segmenterRef.current.getRemainingText();
        if (remainingText && remainingText.trim()) {
          console.log('虚拟人集成: 处理剩余文本', {
            remainingText: remainingText.slice(0, 50) + '...'
          });
          
          // 只处理虚拟人控制，TTS播放由CameraModeAdapter处理
          handleAIResponse(remainingText).catch(error => {
            console.error('虚拟人集成: 处理剩余文本失败', error);
          });
        }
      }
    }
  }, [chatLoadingId, hasController, isProcessing]);

  // 调试信息
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const segmenterStatus = segmenterRef.current.getStatus();
      console.log('虚拟人控制器状态:', {
        state,
        isProcessing,
        hasController,
        hasStream: !!currentStream,
        chatLoadingId,
        chatCount: currentChats.length,
        segmenterStatus
      });
    }
  }, [state, isProcessing, hasController, currentStream, chatLoadingId, currentChats.length]);

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
      {/* 状态指示器 */}
      <div style={{ 
        padding: '4px 8px', 
        background: isProcessing ? '#ff6b6b' : state === 'error' ? '#ff4757' : '#51cf66',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        marginBottom: '8px'
      }}>
        {isProcessing ? '处理中...' : state === 'error' ? '错误' : '就绪'}
      </div>

      {/* 状态信息 */}
      <div style={{ 
        padding: '8px', 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        maxWidth: '200px'
      }}>
        <div>状态: {state}</div>
        <div>控制器: {hasController ? '已连接' : '未连接'}</div>
        <div>消息数: {currentChats.length}</div>
        {currentStream && (
          <>
            <div>表情: {currentStream.expression}</div>
            <div>动作: {currentStream.motion?.join(', ')}</div>
            <div>相机: {currentStream.camera}</div>
          </>
        )}
      </div>
    </div>
  );
});

VirtualHumanIntegration.displayName = 'VirtualHumanIntegration';

export default VirtualHumanIntegration; 