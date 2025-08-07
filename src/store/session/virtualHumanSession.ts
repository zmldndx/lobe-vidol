import { StateCreator } from 'zustand';
import { VirtualHumanFactory } from '@/libs/virtualHuman/VirtualHumanFactory';
import { CameraModeAdapter } from '@/libs/virtualHuman/adapters/CameraModeAdapter';
import { StreamIntegration } from '@/libs/virtualHuman/integration/StreamIntegration';
import { VirtualHumanController } from '@/libs/virtualHuman/core/VirtualHumanController';
import { useGlobalStore } from '@/store/global';
import { chatCompletion, handleSpeakAi } from '@/services/chat';
import { ChatMessage } from '@/types/chat';
import { OpenAIChatMessage } from '@/types/provider/chat';
import { DEFAULT_LLM_CONFIG } from '@/constants/agent';
import { chatHelpers } from '@/store/session/helpers';
import { sessionSelectors } from './selectors';

/**
 * 扩展的SessionStore，集成虚拟人控制系统
 */
export interface VirtualHumanSessionStore {
  // 销毁虚拟人控制系统
  destroyVirtualHumanSystem: () => void;
  // 增强的fetchAIResponse，集成虚拟人控制
  fetchAIResponseWithVirtualHuman: (messages: ChatMessage[], assistantId: string) => Promise<void>;
  // 初始化虚拟人控制系统
  initVirtualHumanSystem: () => void;
  
  streamIntegration?: StreamIntegration;
  
  virtualHumanAdapter?: CameraModeAdapter;
  
  // 虚拟人控制系统相关
  virtualHumanController?: VirtualHumanController;
}

/**
 * 创建集成虚拟人控制系统的session store
 */
export const createVirtualHumanSessionStore = (
  baseStore: StateCreator<any, [['zustand/devtools', never]]>
): StateCreator<any, [['zustand/devtools', never]]> => (set, get, api) => ({
  ...baseStore(set, get, api),

  // 初始化虚拟人控制系统
  initVirtualHumanSystem: () => {
    const viewer = useGlobalStore.getState().viewer;
    if (!viewer) {
      console.warn('Viewer未初始化，无法创建虚拟人控制系统');
      return;
    }

    try {
      // 创建虚拟人控制器
      const controller = VirtualHumanFactory.createDefaultController();
      
      // 创建适配器
      const adapter = new CameraModeAdapter(controller, viewer);
      
      // 创建流式集成
      const streamIntegration = new StreamIntegration(controller, adapter);

      set({
        virtualHumanController: controller,
        virtualHumanAdapter: adapter,
        streamIntegration: streamIntegration
      });

      console.log('虚拟人控制系统初始化成功');
    } catch (error) {
      console.error('虚拟人控制系统初始化失败:', error);
    }
  },

  // 销毁虚拟人控制系统
  destroyVirtualHumanSystem: () => {
    const { virtualHumanController, virtualHumanAdapter, streamIntegration } = get();
    
    if (streamIntegration) {
      streamIntegration.reset();
    }
    
    if (virtualHumanAdapter) {
      virtualHumanAdapter.destroy();
    }
    
    if (virtualHumanController) {
      virtualHumanController.destroy();
    }

    set({
      virtualHumanController: undefined,
      virtualHumanAdapter: undefined,
      streamIntegration: undefined
    });

    console.log('虚拟人控制系统已销毁');
  },

  // 增强的fetchAIResponse，集成虚拟人控制
  fetchAIResponseWithVirtualHuman: async (messages: ChatMessage[], assistantId: string) => {
    const { dispatchMessage } = get();
    const currentSession = sessionSelectors.currentSession(get());
    const currentAgent = sessionSelectors.currentAgent(get());

    if (!currentSession || !currentAgent) {
      return;
    }

    const abortController = new AbortController();
    set({ chatLoadingId: assistantId, abortController });

    let receivedMessage = '';
    let aiMessage = '';
    const sentences = [];

    const { voiceOn, chatMode } = useGlobalStore.getState();
    const { streamIntegration } = get();

    // 处理历史消息数
    const chatConfig = sessionSelectors.currentSessionChatConfig(get());
    const preprocessMsgs = chatHelpers.getSlicedMessagesWithConfig(messages, chatConfig, true);

    if (currentAgent.systemRole) {
      preprocessMsgs.unshift({ content: currentAgent.systemRole, role: 'system' } as ChatMessage);
    }

    const postMessages: OpenAIChatMessage[] = preprocessMsgs.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      await chatCompletion(
        {
          model: currentAgent.model || DEFAULT_LLM_CONFIG.model,
          provider: currentAgent.provider || DEFAULT_LLM_CONFIG.provider,
          stream: true,
          ...(currentAgent.params || DEFAULT_LLM_CONFIG.params),
          messages: postMessages,
        },
        {
          onErrorHandle: (error) => {
            dispatchMessage({
              payload: {
                id: assistantId,
                key: 'error',
                value: error,
              },
              type: 'UPDATE_MESSAGE',
            });
          },
          onMessageHandle: async (chunk) => {
            switch (chunk.type) {
              case 'text': {
                // 只有视频模式下才需要连续语音合成和虚拟人控制
                if (voiceOn && chatMode === 'camera') {
                  // 语音合成
                  receivedMessage += chunk.text;
                  
                  // 文本切割
                  const sentenceMatch = receivedMessage.match(/^(.+[\n~。！．？]|.{10,}[,、])/);
                  if (sentenceMatch && sentenceMatch[0]) {
                    const sentence = sentenceMatch[0];
                    sentences.push(sentence);
                    receivedMessage = receivedMessage.slice(sentence.length).trimStart();

                    if (
                      !sentence.replaceAll(
                        /^[\s()[\]}«»‹›〈〉《》「」『』【】〔〕〘〙〚〛（）［］｛]+$/g,
                        '',
                      )
                    ) {
                      return;
                    }
                    
                    // 处理语音合成
                    handleSpeakAi(sentence);
                    
                    // 集成虚拟人控制系统
                    if (streamIntegration) {
                      await streamIntegration.handleStreamChunk(sentence);
                    }
                  }
                }

                // 对话更新
                aiMessage += chunk.text;

                dispatchMessage({
                  payload: {
                    id: assistantId,
                    key: 'content',
                    value: aiMessage,
                  },
                  type: 'UPDATE_MESSAGE',
                });
                break;
              }
            }
          },
          onFinish: async () => {
            // 处理流式完成
            if (streamIntegration) {
              await streamIntegration.handleStreamComplete();
            }
          },
          signal: abortController.signal,
        },
      );
    } catch (error) {
      console.error('AI回复请求失败:', error);
    } finally {
      set({ chatLoadingId: undefined });
    }
  },
}); 