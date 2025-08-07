'use client';

import { isEqual } from 'lodash-es';
import React, { memo } from 'react';
import { Flexbox } from 'react-layout-kit';
import dynamic from 'next/dynamic';

import AgentViewer from '@/features/AgentViewer';
import { sessionSelectors, useSessionStore } from '@/store/session';

import Background from './Background';
import Operation from './Operation';
import Settings from './Settings';
import { useStyles } from './style';

// 动态导入调试面板，避免chunk加载问题
const EnhancedDebugPanel = dynamic(
  () => import('./VirtualHumanDebugPanel/EnhancedDebugPanel'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 动态导入对话面板
const ChatDialog = dynamic(
  () => import('./ChatDialog'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 动态导入虚拟人集成组件
const VirtualHumanIntegration = dynamic(
  () => import('./VirtualHumanIntegration'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 简化的CameraMode组件
const CameraMode = memo(() => {
  const { styles } = useStyles();
  const [currentAgent, interactive] = useSessionStore(
    (s) => [sessionSelectors.currentAgent(s), s.interactive],
    isEqual,
  );

  // 调试日志
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CameraMode 渲染状态:', {
        hasAgent: !!currentAgent,
        agentId: currentAgent?.agentId,
        interactive
      });
    }
  }, [currentAgent, interactive]);

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
        <ChatDialog className={styles.dialog} />
        <Flexbox flex={1} className={styles.mask} />
        <Flexbox align={'center'} className={styles.docker}>
          <Operation />
        </Flexbox>
      </Flexbox>
      <Settings />
      <Background />
      
      {/* 虚拟人调试面板 - 使用动态导入 */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000 }}>
        <EnhancedDebugPanel />
      </div>
      
      {/* 虚拟人集成组件 */}
      <VirtualHumanIntegration />
    </Flexbox>
  );
});

CameraMode.displayName = 'CameraMode';

export default CameraMode;
