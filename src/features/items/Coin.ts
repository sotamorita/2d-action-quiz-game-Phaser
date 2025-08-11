import BaseObject from '../../core/game-objects/BaseObject';

/**
 * @constant COIN_VALUE
 * @description コインを取得した際に加算されるスコアの値。
 */
const COIN_VALUE = 1;

/**
 * @constant COIN_SPIN_SPEED
 * @description コインが回転するアニメーションの速度（現在は未使用）。
 */
const COIN_SPIN_SPEED = 1;

/**
 * @class Coin
 * @description
 * プレイヤーが収集可能なコインオブジェクトを表すクラスです。
 * `BaseObject`を継承し、物理的な特性を持ちます。
 *
 * [設計思想]
 * - **基底クラスの継承**: `BaseObject`を継承することで、Phaserの物理エンジンへの登録や
 *   基本的なゲームオブジェクトとしての振る舞いを共通化しています。これにより、
 *   `Coin`クラスはコイン固有のロジック（スコアの値など）の実装に集中できます。
 * - **データのカプセル化**: コインの価値（`value`）などのプロパティをクラス内に保持しています。
 *   これにより、`CollisionSystem`などでコインオブジェクトにアクセスした際に、
 *   そのコインが持つデータを直接参照できます。
 * - **オブジェクトプーリング対応**: `initialize`メソッドは、Phaserのオブジェクトプール機能と
 *   連携するために用意されています。一度使用されて非表示になったコインを、
 *   新しいインスタンスを生成せずに再利用（リサイクル）する際に、このメソッドが呼ばれて
 *   状態をリセットします。これにより、特に多くのコインが出現するステージでの
 *   パフォーマンスが向上します。
 *
 * @extends {BaseObject}
 */
export default class Coin extends BaseObject {
  /**
   * @property {number} value - このコインを取得した際のスコア。
   * @readonly
   */
  readonly value: number;

  /**
   * @property {number} spinSpeed - コインの回転速度（現在のアニメーションでは未使用）。
   * @readonly
   */
  readonly spinSpeed: number;

  /**
   * Coinクラスのインスタンスを生成します。
   * @param scene - このオブジェクトが属するシーン。
   * @param x - X座標。
   * @param y - Y座標。
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'coin');

    this.value = COIN_VALUE;
    this.spinSpeed = COIN_SPIN_SPEED;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);
  }

  /**
   * オブジェクトプールから再利用される際に呼び出される初期化メソッドです。
   * オブジェクトをアクティブ状態に戻し、物理ボディを再度有効にします。
   * これにより、新しいインスタンスを生成するコストをかけずにオブジェクトを再登場させることができます。
   */
  public initialize(): void {
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
    }
  }
}
