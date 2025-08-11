/**
 * @namespace UIConstants
 * @description
 * ゲーム全体のUIに関するデザインシステムを定義する定数オブジェクトです。
 * 色、フォントサイズ、レイアウトなどの視覚的要素をここで一元管理することにより、
 * プロジェクト全体で一貫したデザインを容易に維持・変更できるようにします。
 *
 * [設計思想]
 * - **単一情報源 (Single Source of Truth)**: UIに関するすべての「マジックナンバー」やハードコードされた値を
 *   このファイルに集約します。例えば、ゲームのテーマカラーを変更したい場合、
 *   このファイルの `Color.Yellow` を変更するだけで、関連するすべてのUIコンポーネントに自動的に反映されます。
 * - **意味的な命名**: `FontSize.Small` や `Color.Red` のように、値そのものではなく、
 *   その値が持つ「意味」や「役割」で名前を付けています。これにより、コードを読む際に
 *   `'12px'` が「小さいフォント」を意図していることが直感的に理解できます。
 * - **構造化**: `Panel`や`Overlay`のように、関連する定数をオブジェクトでグループ化することで、
 *   目的の定数を見つけやすくし、コードの可読性を高めています。
 */
export const UIConstants = {
  /**
   * @property {string} FontFamily
   * @description ゲーム全体で使用する基本のフォントファミリー。
   * レトロな雰囲気を出すために "DotGothic16" を優先的に使用し、
   * 利用できない環境では汎用のsans-serifフォントで代替表示（フォールバック）します。
   */
  FontFamily: '"DotGothic16", sans-serif',

  /**
   * @property {object} Color
   * @description UIで使用する色のパレット。プロジェクトのカラースキームを定義します。
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
   * @property {object} FontSize
   * @description UIテキストの階層を定義するフォントサイズ。
   * Small, Normal, Large, Title の4段階で情報の重要度を示します。
   */
  FontSize: {
    Small: '12px',
    Normal: '16px',
    Large: '20px',
    Title: '32px',
  },

  /**
   * @property {object} Text
   * @description テキスト要素に共通して適用されるスタイル。
   */
  Text: {
    LineSpacing: 5,
    Padding: { x: 10, y: 5 },
  },

  /**
   * @property {object} Panel
   * @description ポップアップウィンドウなどのパネルUIの共通スタイル。
   * 枠線の色や太さ、背景の透明度などを定義します。
   */
  Panel: {
    BorderColor: 0xffffff,
    BorderWidth: 4,
    BgColor: 0x000000,
    BgAlpha: 0.8,
  },

  /**
   * @property {object} Overlay
   * @description パネル表示時に背景を暗くするためのオーバーレイの共通スタイル。
   */
  Overlay: {
    BgColor: 0x000000,
    BgAlpha: 0.6,
  },

  /**
   * @property {object} Background
   * @description ゲームシーンの背景（地面や空など）のレイアウトに関する定数。
   * 主に `CommonBackground` クラスで参照されます。
   */
  Background: {
    GroundY: 380,
    TileSpriteX: 0,
    TileSpriteY: 0,
    TileSpriteWidth: 1600,
    TileSpriteHeight: 320,
  },
};
