import React, { memo, useState, useEffect, useRef } from 'react';
import { Button, Card, List, Tag, Typography, Space, Tooltip, Tabs, Statistic, Progress } from 'antd';
import { 
  BugOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CameraOutlined,
  SmileOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  BarChartOutlined,
  ReloadOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useVirtualHumanController } from '@/hooks/useVirtualHumanController';
import { useGlobalStore } from '@/store/global';
import { RenderStream } from '@/types/renderStream';
import { formatTime, getExpressionColor, getMotionColor, getCameraColor } from './utils';

const { Text } = Typography;
const { TabPane } = Tabs;

interface EnhancedDebugPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 增强版虚拟人调试面板
 * 提供更详细的调试信息和统计功能
 */
const EnhancedDebugPanel = memo<EnhancedDebugPanelProps>(({ className, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [renderStreams, setRenderStreams] = useState<RenderStream[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('streams');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const viewer = useGlobalStore((s) => s.viewer);
  const { getControllerState, getHistory, clearHistory } = useVirtualHumanController(viewer);
  const { hasController, currentStream, state, isProcessing } = getControllerState();

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
    if (scrollRef.current && isExpanded && activeTab === 'streams') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [renderStreams, isExpanded, activeTab]);

  // 清空记录
  const clearRecords = () => {
    setRenderStreams([]);
    if (hasController) {
      clearHistory();
    }
  };

  // 获取统计信息
  const getStatistics = () => {
    const stats = {
      totalStreams: renderStreams.length,
      expressions: {} as Record<string, number>,
      motions: {} as Record<string, number>,
      cameras: {} as Record<string, number>,
      scenes: {} as Record<string, number>,
      backgrounds: {} as Record<string, number>
    };

    renderStreams.forEach(stream => {
      if (stream.expression) {
        stats.expressions[stream.expression] = (stats.expressions[stream.expression] || 0) + 1;
      }
      if (stream.motion) {
        stream.motion.forEach(motion => {
          stats.motions[motion] = (stats.motions[motion] || 0) + 1;
        });
      }
      if (stream.camera) {
        stats.cameras[stream.camera] = (stats.cameras[stream.camera] || 0) + 1;
      }
      if (stream.scene) {
        stats.scenes[stream.scene] = (stats.scenes[stream.scene] || 0) + 1;
      }
      if (stream.background) {
        stats.backgrounds[stream.background] = (stats.backgrounds[stream.background] || 0) + 1;
      }
    });

    return stats;
  };

  // 格式化render_stream信息
  const formatRenderStream = (stream: RenderStream, index: number) => {
    return (
      <Card 
        key={stream.streamId || index} 
        size="small" 
        className="stream-card"
        style={{ marginBottom: 8 }}
        title={
          <Space>
            <Text strong>#{index + 1}</Text>
            <Tag color="blue">{formatTime(stream.timestamp)}</Tag>
            {stream.expression && (
              <Tag color={getExpressionColor(stream.expression)} icon={<SmileOutlined />}>
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
              <Tag color={getExpressionColor(stream.expression)} icon={<SmileOutlined />}>
                表情: {stream.expression}
              </Tag>
            )}
            {stream.motion && stream.motion.length > 0 && (
              <Tag color={getMotionColor(stream.motion[0])} icon={<PlayCircleOutlined />}>
                动作: {stream.motion.join(', ')}
              </Tag>
            )}
          </Space>

          {/* 相机和场景 */}
          <Space wrap>
            {stream.camera && (
              <Tag color={getCameraColor(stream.camera)} icon={<CameraOutlined />}>
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

  // 渲染统计面板
  const renderStatistics = () => {
    const stats = getStatistics();
    
    return (
      <div>
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 基本统计 */}
          <Card size="small" title="基本统计">
            <Space wrap>
              <Statistic title="总记录数" value={stats.totalStreams} />
              <Statistic title="当前状态" value={state} />
              <Statistic title="处理中" value={isProcessing ? '是' : '否'} />
            </Space>
          </Card>

          {/* 表情统计 */}
          {Object.keys(stats.expressions).length > 0 && (
            <Card size="small" title="表情统计">
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(stats.expressions).map(([expression, count]) => (
                  <div key={expression}>
                    <Space>
                      <Tag color={getExpressionColor(expression)}>{expression}</Tag>
                      <Text>{count} 次</Text>
                      <Progress 
                        percent={Math.round((count / stats.totalStreams) * 100)} 
                        size="small" 
                        style={{ width: 100 }}
                      />
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          )}

          {/* 动作统计 */}
          {Object.keys(stats.motions).length > 0 && (
            <Card size="small" title="动作统计">
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(stats.motions).map(([motion, count]) => (
                  <div key={motion}>
                    <Space>
                      <Tag color={getMotionColor(motion)}>{motion}</Tag>
                      <Text>{count} 次</Text>
                      <Progress 
                        percent={Math.round((count / stats.totalStreams) * 100)} 
                        size="small" 
                        style={{ width: 100 }}
                      />
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          )}

          {/* 相机统计 */}
          {Object.keys(stats.cameras).length > 0 && (
            <Card size="small" title="相机统计">
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(stats.cameras).map(([camera, count]) => (
                  <div key={camera}>
                    <Space>
                      <Tag color={getCameraColor(camera)}>{camera}</Tag>
                      <Text>{count} 次</Text>
                      <Progress 
                        percent={Math.round((count / stats.totalStreams) * 100)} 
                        size="small" 
                        style={{ width: 100 }}
                      />
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          )}
        </Space>
      </div>
    );
  };

  // 渲染设置面板
  const renderSettings = () => {
    return (
      <div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card size="small" title="控制器设置">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>控制器状态: </Text>
                <Tag color={hasController ? 'green' : 'red'}>
                  {hasController ? '已连接' : '未连接'}
                </Tag>
              </div>
              <div>
                <Text>当前状态: </Text>
                <Tag color="blue">{state}</Tag>
              </div>
              <div>
                <Text>处理状态: </Text>
                <Tag color={isProcessing ? 'orange' : 'green'}>
                  {isProcessing ? '处理中' : '空闲'}
                </Tag>
              </div>
            </Space>
          </Card>

          <Card size="small" title="操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
              <Button 
                type="default" 
                size="small" 
                icon={<ClearOutlined />}
                onClick={clearRecords}
              >
                清空记录
              </Button>
            </Space>
          </Card>
        </Space>
      </div>
    );
  };

  if (!hasController) {
    return null;
  }

  return (
    <div 
      className={className} 
      style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        zIndex: 1000,
        width: isExpanded ? 450 : 'auto',
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
          <Tooltip title={isExpanded ? '收缩面板' : '展开面板'}>
              <Button
                type="text"
                size="small"
                icon={<BugOutlined />}
                onClick={() => setIsExpanded(!isExpanded)}
              />
            </Tooltip>
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
            width: isExpanded ? 450 : 200,
            maxHeight: isExpanded ? 700 : 100,
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
        >
          {isExpanded ? (
            // 展开状态：显示标签页
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              size="small"
              style={{ height: 600 }}
            >
              <TabPane tab="流记录" key="streams">
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
              </TabPane>
              
              <TabPane tab="统计" key="statistics" icon={<BarChartOutlined />}>
                <div style={{ height: 500, overflowY: 'auto', paddingRight: 8 }}>
                  {renderStatistics()}
                </div>
              </TabPane>
              
              <TabPane tab="设置" key="settings" icon={<SettingOutlined />}>
                <div style={{ height: 500, overflowY: 'auto', paddingRight: 8 }}>
                  {renderSettings()}
                </div>
              </TabPane>
            </Tabs>
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

EnhancedDebugPanel.displayName = 'EnhancedDebugPanel';

export default EnhancedDebugPanel; 