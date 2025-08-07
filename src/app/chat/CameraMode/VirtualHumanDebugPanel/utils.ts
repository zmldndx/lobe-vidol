/**
 * 格式化时间戳
 */
export const formatTime = (timestamp?: number): string => {
  if (!timestamp) return '--:--';
  
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化持续时间
 */
export const formatDuration = (startTime: number, endTime: number): string => {
  const duration = endTime - startTime;
  const seconds = Math.floor(duration / 1000);
  const milliseconds = duration % 1000;
  
  return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
};

/**
 * 获取表情颜色
 */
export const getExpressionColor = (expression?: string): string => {
  const colorMap: Record<string, string> = {
    'happy': 'green',
    'smile': 'green',
    'sad': 'blue',
    'cry': 'blue',
    'angry': 'red',
    'surprised': 'orange',
    'fear': 'purple',
    'disgust': 'brown',
    'neutral': 'default'
  };
  
  return colorMap[expression || 'neutral'] || 'default';
};

/**
 * 获取动作颜色
 */
export const getMotionColor = (motion?: string): string => {
  const colorMap: Record<string, string> = {
    'wave': 'blue',
    'dance': 'purple',
    'fist': 'red',
    'point': 'orange',
    'head_down': 'gray',
    'sigh': 'gray',
    'cry': 'blue',
    'wipe_tears': 'blue',
    'jump': 'orange',
    'hands_up': 'orange',
    'shrink': 'purple',
    'cover_face': 'purple',
    'turn_away': 'brown',
    'cover_nose': 'brown',
    'idle': 'default',
    'look_around': 'default'
  };
  
  return colorMap[motion || 'idle'] || 'default';
};

/**
 * 获取相机模式颜色
 */
export const getCameraColor = (camera?: string): string => {
  const colorMap: Record<string, string> = {
    '空': 'default',
    '智能镜头': 'blue',
    '跟踪-大脸': 'purple',
    '跟踪-背向': 'orange',
    '跟踪-朝向': 'green'
  };
  
  return colorMap[camera || '空'] || 'default';
}; 