/**
 * UI全体のデザインやレイアウトに関する設定値を集約したオブジェクト
 * ゲーム全体のデザインを一貫させるための基本ルールを定義する
 */
export const UIConstants = {
  /**
   * フォントファミリー
   * Main: 通常のテキストに使用
   * Title: タイトルや見出しに使用
   */
  FontFamily: '"DotGothic16", sans-serif',

  /**
   * 基本色
   */
  Color: {
    White: '#ffffff',
    Black: '#000000',
    Yellow: '#ffff00',
    Green: '#00ff00',
    Red: '#ff0000',
    Grey: '#cccccc',
    DarkGrey: '#666666',
  },

  /**
   * 基本フォントサイズ
   */
  FontSize: {
    Small: '12px',
    Normal: '16px',
    Large: '20px',
    Title: '32px',
  },

  /**
   * テキストの共通スタイル
   */
  Text: {
    LineSpacing: 5,
    Padding: { x: 10, y: 5 },
  },

  /**
   * パネルの共通スタイル
   */
  Panel: {
    BorderColor: 0xffffff,
    BorderWidth: 4,
    BgColor: 0x000000,
    BgAlpha: 0.8,
  },

  /**
   * オーバーレイの共通スタイル
   */
  Overlay: {
    BgColor: 0x000000,
    BgAlpha: 0.6,
  },

  /**
   * 背景画像の基本レイアウト
   */
  Background: {
    GroundY: 380,
    TileSpriteX: 0,
    TileSpriteY: 80,
    TileSpriteWidth: 1600,
    TileSpriteHeight: 320,
  },
};
