import { useEffect, useState, useCallback } from 'react';
import { VirtualHumanFactory } from '@/libs/virtualHuman/VirtualHumanFactory';
import { CameraModeAdapter } from '@/libs/virtualHuman/adapters/CameraModeAdapter';
import { VirtualHumanController } from '@/libs/virtualHuman/core/VirtualHumanController';
import { RenderStream, RenderStreamState } from '@/types/renderStream';
import { Viewer } from '@/libs/vrmViewer/viewer';

/**
 * 虚拟人控制器Hook
 */
export const useVirtualHumanController = (viewer: Viewer | null) => {
  const [controller, setController] = useState<VirtualHumanController | null>(null);
  const [adapter, setAdapter] = useState<CameraModeAdapter | null>(null);
  const [state, setState] = useState<RenderStreamState>(RenderStreamState.IDLE);
  const [currentStream, setCurrentStream] = useState<RenderStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 初始化控制器
  useEffect(() => {
    if (!viewer) return;

    const newController = VirtualHumanFactory.createDefaultController();
    const newAdapter = new CameraModeAdapter(newController, viewer);

    setController(newController);
    setAdapter(newAdapter);

    // 监听状态变化
    newController.on('stateChanged', ({ newState }) => {
      setState(newState);
    });

    // 监听渲染流就绪
    newController.on('renderStreamReady', (stream: RenderStream) => {
      console.log('Hook: 收到renderStreamReady事件', {
        streamId: stream.streamId,
        expression: stream.expression,
        motion: stream.motion,
        camera: stream.camera,
        text: stream.text?.slice(0, 50) + '...'
      });
      setCurrentStream(stream);
    });

    // 监听处理状态
    newController.on('aiResponseReceived', () => {
      setIsProcessing(true);
    });

    newController.on('aiResponseProcessed', () => {
      setIsProcessing(false);
    });

    // 监听错误状态，确保重置处理状态
    newController.on('error', () => {
      setIsProcessing(false);
    });

    return () => {
      newAdapter.destroy();
      newController.destroy();
    };
  }, [viewer]);

  /**
   * 处理AI流式回复
   */
  const handleAIResponse = useCallback(async (text: string) => {
    if (!adapter || isProcessing) {
      console.warn('适配器未初始化或正在处理中');
      return;
    }

    try {
      await adapter.handleAIResponse(text);
    } catch (error) {
      console.error('处理AI回复失败:', error);
    }
  }, [adapter, isProcessing]);

  /**
   * 获取控制器状态
   */
  const getControllerState = () => {
    return {
      state,
      isProcessing,
      currentStream,
      hasController: !!controller,
      hasAdapter: !!adapter
    };
  };

  /**
   * 更新配置
   */
  const updateConfig = (newConfig: Partial<any>) => {
    if (controller) {
      controller.updateConfig(newConfig);
    }
  };

  /**
   * 清空历史记录
   */
  const clearHistory = () => {
    if (controller) {
      controller.clearHistory();
    }
  };

  /**
   * 获取历史记录
   */
  const getHistory = () => {
    if (controller) {
      return controller.getHistory();
    }
    return { streams: [], currentIndex: -1, maxHistory: 50 };
  };

  return {
    handleAIResponse,
    getControllerState,
    updateConfig,
    clearHistory,
    getHistory,
    controller,
    adapter
  };
}; 