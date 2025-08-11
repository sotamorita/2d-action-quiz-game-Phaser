import BaseObject from '../../core/game-objects/BaseObject';

/**
 * @constant HEAL_AMOUNT
 * @description ハートを取得した際にプレイヤーのHPが回復する量。
 */
const HEAL_AMOUNT = 1;

/**
 * @class Heart
 * @description
 * プレイヤーが収集するとHPを回復するハートアイテムを表すクラスです。
 * `BaseObject`を継承しています。
 *
 * [設計思想]
 * - **クラスによる責務の明確化**: `Coin`クラスと同様に、`Heart`クラスはハートアイテム固有の
 *   振る舞いとデータ（この場合は回復量`healAmount`）を持つ責務を担います。
 *   これにより、アイテムの種類ごとに異なるロジックをカプセル化し、コードの
 *   見通しを良くしています。
 * - **データ駆動のインタラクション**: プレイヤーがこのオブジェクトと衝突した際、
 *   `CollisionSystem`は`Heart`インスタンスの`healAmount`プロパティを参照して、
 *   具体的な回復処理を`Player`オブジェクトに対して行います。このように、オブジェクトが
 *   自身のデータを持つことで、衝突処理のロジックがシンプルになります。
 * - **オブジェクトプーリング対応**: `Coin`クラスと同様に`initialize`メソッドを持ち、
 *   オブジェクトの再利用に対応しています。これにより、パフォーマンスの最適化を図っています。
 *
 * @extends {BaseObject}
 */
export default class Heart extends BaseObject {
  /**
   * @property {number} healAmount - このハートを取得した際のHP回復量。
   * @readonly
   */
  readonly healAmount: number;

  /**
   * Heartクラスのインスタンスを生成します。
   * @param scene - このオブジェクトが属するシーン。
   * @param x - X座標。
   * @param y - Y座標。
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'heart');

    this.healAmount = HEAL_AMOUNT;

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
