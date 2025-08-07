# 虚拟人控制系统

## 概述

虚拟人控制系统是一个高内聚、低耦合的模块化系统，用于在camera模式下实现虚拟人的智能控制。系统采用事件驱动的架构，支持流式生成和无缝切换。

## 系统架构

```
AI流式回复 -> 智能断句 + [状态机：history_render_streams] -> AI生成 render_stream -> 触发无缝切换
```

### 核心组件

1. **VirtualHumanController** - 核心控制器
   - 负责协调各个模块
   - 管理状态机和历史记录
   - 处理AI流式回复

2. **SegmentationModule** - 智能断句模块
   - 基于标点符号和情感关键词进行智能断句
   - 分析文本情感和强调程度
   - 计算停顿时间

3. **GenerationModule** - 渲染流生成模块
   - 根据断句结果生成render_stream
   - 映射情感到表情和动作
   - 智能相机控制

4. **TransitionModule** - 无缝切换模块
   - 实现平滑的状态切换
   - 支持交叉淡入淡出
   - 确保切换的连续性

5. **CameraModeAdapter** - 适配器
   - 将虚拟人控制系统集成到现有camera模式
   - 映射VRM表情和动作
   - 处理语音合成

## 协议定义

### render_stream 协议

```typescript
interface RenderStream {
  text?: string;                    // 文本内容
  audio?: string;                   // 音频数据 (base64编码)
  expression?: string;              // 表情类型
  motion?: string[];               // 动作列表
  scene?: string;                  // 场景名称
  background?: string;             // 背景图片
  camera?: string;                 // 相机模式
  timestamp?: number;              // 时间戳
  streamId?: string;               // 流ID
}
```

### 相机模式

- `空` - 无特殊相机控制
- `智能镜头` - 根据内容智能调整
- `跟踪-大脸` - 特写镜头
- `跟踪-背向` - 背面跟踪
- `跟踪-朝向` - 正面跟踪

## 使用方法

### 1. 基本使用

```typescript
import { VirtualHumanFactory } from '@/libs/virtualHuman/VirtualHumanFactory';
import { CameraModeAdapter } from '@/libs/virtualHuman/adapters/CameraModeAdapter';

// 创建控制器
const controller = VirtualHumanFactory.createDefaultController();
const adapter = new CameraModeAdapter(controller, viewer);

// 处理AI回复
await adapter.handleAIResponse("你好，我很开心见到你！");
```

### 2. React Hook 使用

```typescript
import { useVirtualHumanController } from '@/hooks/useVirtualHumanController';

const MyComponent = () => {
  const { handleAIResponse, getControllerState } = useVirtualHumanController(viewer);
  
  const handleAIStream = async (text: string) => {
    await handleAIResponse(text);
  };
  
  return <div>...</div>;
};
```

### 3. 自定义配置

```typescript
const controller = VirtualHumanFactory.createCustomController({
  enableSmartSegmentation: true,
  enableSeamlessTransition: true,
  enableEmotionAnalysis: true,
  defaultExpression: 'neutral',
  defaultMotion: ['idle'],
  defaultCamera: '智能镜头'
});
```

## 模块扩展

### 添加新的断句策略

```typescript
class CustomSegmentationModule implements ISegmentationModule {
  async segment(text: string): Promise<SentenceSegment[]> {
    // 实现自定义断句逻辑
    return segments;
  }
}

controller.registerModule('customSegmentation', new CustomSegmentationModule());
```

### 添加新的渲染流生成策略

```typescript
class CustomGenerationModule implements IGenerationModule {
  async generate(segment: SentenceSegment, history: RenderStreamHistory): Promise<RenderStream> {
    // 实现自定义生成逻辑
    return renderStream;
  }
}

controller.registerModule('customGeneration', new CustomGenerationModule());
```

## 事件系统

控制器支持以下事件：

- `aiResponseReceived` - AI回复接收
- `aiResponseProcessed` - AI回复处理完成
- `renderStreamReady` - 渲染流就绪
- `stateChanged` - 状态变化
- `error` - 错误事件
- `moduleRegistered` - 模块注册
- `configUpdated` - 配置更新
- `historyCleared` - 历史记录清空

## 性能优化

1. **历史记录限制** - 默认限制50条历史记录
2. **并行处理** - 多个切换操作并行执行
3. **状态缓存** - 避免重复的状态切换
4. **事件节流** - 防止频繁的事件触发

## 调试

在开发模式下，系统会输出详细的调试信息：

```typescript
// 启用调试模式
if (process.env.NODE_ENV === 'development') {
  controller.on('stateChanged', ({ oldState, newState }) => {
    console.log(`状态变化: ${oldState} -> ${newState}`);
  });
}
```

## 注意事项

1. 确保viewer实例已正确初始化
2. 在组件卸载时调用destroy()方法清理资源
3. 处理异步操作时注意错误边界
4. 根据实际需求调整配置参数

## 未来扩展

1. **AI情感分析** - 集成更高级的情感分析模型
2. **动作库扩展** - 支持更多自定义动作
3. **场景管理** - 实现动态场景切换
4. **性能监控** - 添加性能指标监控
5. **插件系统** - 支持第三方插件扩展 