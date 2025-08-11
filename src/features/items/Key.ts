import BaseObject from '../../core/game-objects/BaseObject';

/**
 * @constant KEY_ID
 * @description 鍵を識別するためのユニークなID。将来的に複数の鍵と扉を対応させる際に使用します。
 */
const KEY_ID = 'default_key';

/**
 * @constant KEY_COLOR
 * @description 鍵の色。現在は未使用ですが、将来的に色違いの鍵を実装する際の拡張用です。
 */
const KEY_COLOR = 'gold';

/**
 * @class Key
 * @description
 * ステージクリアや特定の扉を開けるために必要な鍵アイテムを表すクラスです。
 * `BaseObject`を継承しています。
 *
 * [設計思想]
 * - **識別子による管理**: `keyId`というプロパティを持たせることで、どの鍵であるかを
 *   一意に識別できるようにしています。これにより、将来的に「金の鍵は金の扉を開けられる」
 *   といった複雑なゲームメカニクスを実装する際の基礎となります。
 * - **状態の保持**: プレイヤーが鍵を持っているかどうかは、`Player`クラスのプロパティや
 *   `GameScene`の状態で管理されます。この`Key`クラスは、あくまでマップ上に存在する
 *   「モノ」としての鍵の振る舞いとデータに責務を限定しています。
 * - **オブジェクトプーリング対応**: 他のアイテムクラスと同様に`initialize`メソッドを備え、
 *   オブジェクトの再利用によるパフォーマンス最適化に対応しています。
 *
 * @extends {BaseObject}
 */
export default class Key extends BaseObject {
  /**
   * @property {string} keyId - この鍵を識別するためのID。
   * @readonly
   */
  readonly keyId: string;

  /**
   * @property {string} color - 鍵の色。
   * @readonly
   */
  readonly color: string;

  /**
   * Keyクラスのインスタンスを生成します。
   * @param scene - このオブジェクトが属するシーン。
   * @param x - X座標。
   * @param y - Y座標。
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'key');

    this.keyId = KEY_ID;
    this.color = KEY_COLOR;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);
  }

  /**
   * オブジェクトプールから再利用される際に呼び出される初期化メソッドです。
   * オブジェクトをアクティブ状態に戻し、物理ボディを再度有効にします。
   */
  public initialize(): void {
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
    }
  }
}
