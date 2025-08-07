import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token, css }) => ({
  debugPanel: css`
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    transition: all 0.3s ease;
    
    .ant-card {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
    }
    
    .ant-card-head {
      background: ${token.colorBgContainer};
      border-bottom: 1px solid ${token.colorBorderSecondary};
    }
    
    .ant-card-body {
      padding: 12px;
    }
  `,
  
  controlButtons: css`
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    justify-content: flex-end;
    
    .ant-btn {
      border-radius: 6px;
    }
  `,
  
  scrollContainer: css`
    height: 500px;
    overflow-y: auto;
    padding-right: 8px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: ${token.colorBgContainer};
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${token.colorBorderSecondary};
      border-radius: 3px;
      
      &:hover {
        background: ${token.colorBorder};
      }
    }
  `,
  
  streamCard: css`
    margin-bottom: 8px;
    border-radius: 6px;
    
    .ant-card-head {
      padding: 8px 12px;
      min-height: auto;
    }
    
    .ant-card-body {
      padding: 12px;
    }
  `,
  
  emptyState: css`
    text-align: center;
    padding: 20px;
    color: ${token.colorTextSecondary};
    
    .anticon {
      font-size: 24px;
      margin-bottom: 8px;
    }
  `,
  
  collapsedContent: css`
    text-align: center;
    
    .ant-space {
      width: 100%;
    }
  `,
  
  tag: css`
    border-radius: 4px;
    font-size: 12px;
  `,
  
  textContent: css`
    word-break: break-word;
    line-height: 1.5;
  `,
  
  audioPreview: css`
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    background: ${token.colorBgContainer};
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid ${token.colorBorderSecondary};
  `,
  
  streamId: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  `
})); 