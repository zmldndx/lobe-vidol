'use client';

import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import CallOff from './actions/CallOff';
import Record from './actions/Record';
import Setting from './actions/Setting';
import TextInput from './TextInput';

const VoiceOperation = memo(() => {
  return (
    <Flexbox gap={24} direction={'vertical'} align={'center'}>
      <Flexbox gap={24} horizontal align={'center'}>
        <CallOff />
        <Record />
        <Setting />
      </Flexbox>
      <TextInput />
    </Flexbox>
  );
});

export default VoiceOperation;
