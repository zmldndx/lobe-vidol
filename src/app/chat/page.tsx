'use client';

import { Spin } from 'antd';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { memo } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import DebugUI from '@/features/DebugUI';
import { useGlobalStore } from '@/store/global';

import ChatMode from './ChatMode';

const CameraMode = dynamic(() => import('./CameraMode/index'), {
  ssr: false,
  loading: () => (
    <Center style={{ height: '100%', width: '100%' }}>
      <Spin />
    </Center>
  ),
});

const Chat = () => {
  const chatMode = useGlobalStore((s) => s.chatMode);

  const searchParams = useSearchParams();
  const showDebug = process.env.NODE_ENV === 'development' && searchParams.get('debug') === 'true';
  return (
    <Flexbox flex={1} height={'100%'} width={'100%'} horizontal>
      {chatMode === 'camera' && <CameraMode />}
      {chatMode === 'chat' && <ChatMode />}
      {showDebug && <DebugUI />}
    </Flexbox>
  );
};

export default memo(Chat);
