import React, { memo, useState, useEffect, useRef } from 'react';
import { Button, Card, List, Tag, Typography, Space, Tooltip } from 'antd';
import { 
  BugOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CameraOutlined,
  SmileOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useVirtualHumanController } from '@/hooks/useVirtualHumanController';
import { useGlobalStore } from '@/store/global';
import { RenderStream } from '@/types/renderStream';
import { formatTime } from './utils';

const { Text } = Typography;

interface VirtualHumanDebugPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 虚拟人调试面板
 * 显示render_stream信息记录，支持收缩展开和滚动查看
 */
const VirtualHumanDebugPanel = memo<VirtualHumanDebugPanelProps>(({ className, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [renderStreams, setRenderStreams] = useState<RenderStream[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const viewer = useGlobalStore((s) => s.viewer);
  const { getControllerState, getHistory } = useVirtualHumanController(viewer);
  const { hasController, currentStream } = getControllerState();

  // 监听新的render_stream
  useEffect(() => {
    if (currentStream) {
      setRenderStreams(prev => [...prev, currentStream]);
    }
  }, [currentStream]);

  // 监听历史记录变化
  useEffect(() => {
    if (hasController) {
      const history = getHistory();
      if (history.streams.length > 0) {
        setRenderStreams(history.streams);
      }
    }
  }, [hasController, getHistory]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [renderStreams, isExpanded]);

  // 清空记录
  const clearRecords = () => {
    setRenderStreams([]);
  };

  // 格式化render_stream信息
  const formatRenderStream = (stream: RenderStream, index: number) => {
    return (
      <Card 
        key={stream.streamId || index} 
        size="small" 
        style={{ marginBottom: 8 }}
        title={
          <Space>
            <Text strong>#{index + 1}</Text>
            <Tag color="blue">{formatTime(stream.timestamp)}</Tag>
            {stream.expression && (
              <Tag color="green" icon={<SmileOutlined />}>
                {stream.expression}
              </Tag>
            )}
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 文本内容 */}
          {stream.text && (
            <div>
              <Text type="secondary">文本:</Text>
              <Text style={{ marginLeft: 8 }}>{stream.text}</Text>
            </div>
          )}

          {/* 表情和动作 */}
          <Space wrap>
            {stream.expression && (
              <Tag color="green" icon={<SmileOutlined />}>
                表情: {stream.expression}
              </Tag>
            )}
            {stream.motion && stream.motion.length > 0 && (
              <Tag color="orange" icon={<PlayCircleOutlined />}>
                动作: {stream.motion.join(', ')}
              </Tag>
            )}
          </Space>

          {/* 相机和场景 */}
          <Space wrap>
            {stream.camera && (
              <Tag color="purple" icon={<CameraOutlined />}>
                相机: {stream.camera}
              </Tag>
            )}
            {stream.scene && (
              <Tag color="cyan">
                场景: {stream.scene}
              </Tag>
            )}
            {stream.background && (
              <Tag color="geekblue">
                背景: {stream.background}
              </Tag>
            )}
          </Space>

          {/* 音频 */}
          {stream.audio && (
            <div>
              <Text type="secondary">音频:</Text>
              <Text code style={{ marginLeft: 8, fontSize: '12px' }}>
                {stream.audio.slice(0, 50)}...
              </Text>
            </div>
          )}

          {/* 流ID */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {stream.streamId}
            </Text>
          </div>
        </Space>
      </Card>
    );
  };

  if (!hasController) {
    return null;
  }

  return (
    <div 
      className={className} 
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000,
        width: isExpanded ? 400 : 'auto',
        transition: 'width 0.3s ease',
        ...style
      }}
    >
      {/* 控制按钮 */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 8,
        justifyContent: 'flex-end'
      }}>
        <Tooltip title={isVisible ? '隐藏面板' : '显示面板'}>
          <Button
            type="text"
            size="small"
            icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setIsVisible(!isVisible)}
          />
        </Tooltip>
        
        {isVisible && (
          <>
            <Tooltip title={isExpanded ? '收缩面板' : '展开面板'}>
              <Button
                type="text"
                size="small"
                icon={<BugOutlined />}
                onClick={() => setIsExpanded(!isExpanded)}
              />
            </Tooltip>
            
            {isExpanded && (
              <Tooltip title="清空记录">
                <Button
                  type="text"
                  size="small"
                  onClick={clearRecords}
                >
                  清空
                </Button>
              </Tooltip>
            )}
          </>
        )}
      </div>

      {/* 调试面板内容 */}
      {isVisible && (
        <Card
          size="small"
          title={
            <Space>
              <BugOutlined />
              <Text strong>虚拟人调试面板</Text>
              <Tag color="blue">{renderStreams.length} 条记录</Tag>
            </Space>
          }
          style={{
            width: isExpanded ? 400 : 200,
            maxHeight: isExpanded ? 600 : 100,
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
        >
          {isExpanded ? (
            // 展开状态：显示详细列表
            <div
              ref={scrollRef}
              style={{
                height: 500,
                overflowY: 'auto',
                paddingRight: 8
              }}
            >
              {renderStreams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  <ClockCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <div>暂无render_stream记录</div>
                  <div style={{ fontSize: 12 }}>等待AI回复...</div>
                </div>
              ) : (
                <List
                  dataSource={renderStreams}
                  renderItem={(stream, index) => formatRenderStream(stream, index)}
                  style={{ padding: 0 }}
                />
              )}
            </div>
          ) : (
            // 收缩状态：显示简要信息
            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <div>
                  <UserOutlined style={{ marginRight: 4 }} />
                  <Text>{renderStreams.length} 条记录</Text>
                </div>
                {renderStreams.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      最新: {renderStreams.at(-1)?.expression || 'neutral'}
                    </Text>
                  </div>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  点击展开查看详情
                </Text>
              </Space>
            </div>
          )}
        </Card>
      )}
    </div>
  );
});

VirtualHumanDebugPanel.displayName = 'VirtualHumanDebugPanel';

export default VirtualHumanDebugPanel; 