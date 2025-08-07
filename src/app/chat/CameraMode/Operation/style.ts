import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token, responsive }) => ({
  alert: css`
    color: ${token.colorTextTertiary};
  `,
  inputContainer: css`
    width: 100%;
    min-width: 360px;
    max-width: 600px;

    ${responsive.mobile} {
      width: 100%;
      min-width: unset;
    }
  `,
})); 