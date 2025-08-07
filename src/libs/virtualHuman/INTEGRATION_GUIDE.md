# 虚拟人控制系统集成指南

## 概述

本指南说明如何将虚拟人智能控制流程集成到AI流式返回消息的过程中，实现以下流程：

```
AI流式回复 -> 智能断句 + [状态机：history_render_streams] -> AI生成 render_stream -> 触发无缝切换
```

## 集成方案

### 方案一：使用现有的Hook集成（推荐）

这是最简单的集成方式，适合大多数场景。

#### 1. 在Camera模式组件中使用

```tsx
// src/app/chat/CameraMode/index.tsx
import VirtualHumanIntegration from './VirtualHumanIntegration';

export default memo(() => {
  // ... 现有代码 ...

  return (
    <Flexbox
      flex={1}
      horizontal
      style={{ height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      <Flexbox flex={1} style={{ position: 'relative' }}>
        {currentAgent ? (
          <div className={styles.viewer}>
            <AgentViewer agentId={currentAgent.agentId} interactive={interactive} />
          </div>
        ) : null}
        <ChatDialog className={classNames(styles.dialog, styles.content)} />
        <Flexbox flex={1} className={styles.mask} />
        <Flexbox align={'center'} className={styles.docker}>
          <Operation />
        </Flexbox>
        
        {/* 添加虚拟人控制系统集成 */}
        <VirtualHumanIntegration />
      </Flexbox>
      <Settings />
      <Background />
    </Flexbox>
  );
});
```

#### 2. 自定义Hook使用

```tsx
// 在组件中使用
const MyComponent = () => {
  const viewer = useGlobalStore((s) => s.viewer);
  const { handleAIResponse, getControllerState } = useVirtualHumanController(viewer);
  
  // 处理AI回复
  const handleAIStream = async (text: string) => {
    await handleAIResponse(text);
  };
  
  return <div>...</div>;
};
```

### 方案二：直接集成到Session Store（高级）

这种方式提供更细粒度的控制，适合需要深度集成的场景。

#### 1. 创建增强的Session Store

```tsx
// 使用增强的session store
import { createVirtualHumanSessionStore } from '@/store/session/virtualHumanSession';

// 在应用初始化时
const sessionStore = createVirtualHumanSessionStore(baseSessionStore);
```

#### 2. 在AI流式处理中集成

```tsx
// 在fetchAIResponse中集成虚拟人控制
const fetchAIResponseWithVirtualHuman = async (messages, assistantId) => {
  // ... 现有代码 ...
  
  await chatCompletion(
    {
      // ... 配置 ...
    },
    {
      onMessageHandle: async (chunk) => {
        switch (chunk.type) {
          case 'text': {
            // 现有的语音合成逻辑
            if (voiceOn && chatMode === 'camera') {
              // ... 现有代码 ...
              
              // 集成虚拟人控制系统
              if (streamIntegration) {
                await streamIntegration.handleStreamChunk(sentence);
              }
            }
            
            // ... 现有代码 ...
          }
        }
      },
      onFinish: async () => {
        // 处理流式完成
        if (streamIntegration) {
          await streamIntegration.handleStreamComplete();
        }
      }
    }
  );
};
```

## 核心集成点

### 1. 流式文本处理

```tsx
// 在AI流式返回过程中处理文本块
public async handleStreamChunk(chunk: string): Promise<void> {
  this.accumulatedText += chunk;
  this.sentenceBuffer += chunk;

  // 检查是否有完整的句子
  const sentences = this.extractCompleteSentences(this.sentenceBuffer);
  
  if (sentences.length > 0) {
    await this.processSentences(sentences);
  }
}
```

### 2. 智能断句

```tsx
// 提取完整句子
private extractCompleteSentences(text: string): string[] {
  const sentenceRegex = /[^。！？；\n]+[。！？；\n]*/g;
  const matches = text.match(sentenceRegex) || [];
  
  return matches
    .map(s => s.trim())
    .filter(s => s.length > 0);
}
```

### 3. 虚拟人控制流程

```tsx
// 处理句子列表
private async processSentences(sentences: string[]): Promise<void> {
  for (const sentence of sentences) {
    // 使用虚拟人控制器处理句子
    await this.adapter.handleAIResponse(sentence);
    
    // 添加延迟避免过于频繁的处理
    await this.delay(100);
  }
}
```

## 配置选项

### 1. 基本配置

```tsx
const controller = VirtualHumanFactory.createDefaultController();
```

### 2. 自定义配置

```tsx
const controller = VirtualHumanFactory.createCustomController({
  enableSmartSegmentation: true,
  enableSeamlessTransition: true,
  enableEmotionAnalysis: true,
  defaultExpression: 'neutral',
  defaultMotion: ['idle'],
  defaultCamera: '智能镜头'
});
```

### 3. 高性能配置

```tsx
const controller = VirtualHumanFactory.createHighPerformanceController();
```

## 事件监听

### 1. 状态变化监听

```tsx
controller.on('stateChanged', ({ oldState, newState }) => {
  console.log(`状态变化: ${oldState} -> ${newState}`);
});
```

### 2. 渲染流监听

```tsx
controller.on('renderStreamReady', (renderStream) => {
  console.log('渲染流就绪:', renderStream);
});
```

### 3. 错误处理

```tsx
controller.on('error', ({ error, context }) => {
  console.error(`错误 [${context}]:`, error);
});
```

## 性能优化

### 1. 历史记录限制

```tsx
// 默认限制50条历史记录
const history = {
  streams: [],
  currentIndex: -1,
  maxHistory: 50
};
```

### 2. 并行处理

```tsx
// 多个切换操作并行执行
await Promise.all(transitions);
```

### 3. 状态缓存

```tsx
// 避免重复的状态切换
if (lastCamera && lastCamera !== '空') {
  return lastCamera;
}
```

## 调试和监控

### 1. 开发模式调试

```tsx
if (process.env.NODE_ENV === 'development') {
  console.log('虚拟人控制器状态:', {
    state,
    isProcessing,
    hasController,
    currentStream
  });
}
```

### 2. 性能监控

```tsx
controller.on('aiResponseProcessed', () => {
  const processingTime = Date.now() - startTime;
  console.log(`处理时间: ${processingTime}ms`);
});
```

## 注意事项

1. **确保viewer实例已初始化** - 在创建虚拟人控制系统前确保viewer已正确初始化
2. **资源清理** - 在组件卸载时调用destroy()方法清理资源
3. **错误边界** - 处理异步操作时注意错误边界
4. **性能考虑** - 根据实际需求调整配置参数，避免过于频繁的处理

## 扩展功能

### 1. 自定义模块

```tsx
// 注册自定义断句模块
const customSegmentationModule = {
  segment: async (text: string) => {
    // 自定义断句逻辑
    return segments;
  }
};

controller.registerModule('customSegmentation', customSegmentationModule);
```

### 2. 自定义配置

```tsx
// 动态更新配置
controller.updateConfig({
  enableSmartSegmentation: false,
  defaultExpression: 'surprised'
});
```

### 3. 历史记录管理

```tsx
// 获取历史记录
const history = controller.getHistory();

// 清空历史记录
controller.clearHistory();
```

通过以上集成方案，您可以将虚拟人智能控制流程无缝集成到AI流式返回消息的过程中，实现智能的虚拟人控制体验。 