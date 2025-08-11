import Phaser from 'phaser';

/**
 * @class BaseObject
 * @description
 * このゲームに登場するすべての物理的なオブジェクト（プレイヤー、敵、アイテムなど）の
 * 基本となるクラスです。PhaserのArcade Physics Spriteを拡張しており、
 * オブジェクトの生成と物理演算の有効化に関する共通処理をカプセル化します。
 *
 * 設計思想:
 * オブジェクト指向の「継承」を利用して、コードの再利用性を高めています。
 * 新しい種類のオブジェクトを追加する際は、このクラスを継承することで、
 * シーンへの登録や物理ボディの有効化といった定型的な処理を省略できます。
 */
export default class BaseObject extends Phaser.Physics.Arcade.Sprite {
  /**
   * BaseObjectのインスタンスを生成します。
   * @param {Phaser.Scene} scene - このオブジェクトが所属するシーン。
   * @param {number} x - オブジェクトの初期X座標。
   * @param {number} y - オブジェクトの初期Y座標。
   * @param {string} texture - オブジェクトに使用するテクスチャのキー。
   */
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    // 親クラス(Phaser.Physics.Arcade.Sprite)のコンストラクタを呼び出します。
    super(scene, x, y, texture);

    // このオブジェクトをシーンの表示リストに追加します。これにより、画面に描画されるようになります。
    scene.add.existing(this);

    // このオブジェクトをシーンの物理エンジンに追加します。これにより、重力や衝突判定が有効になります。
    scene.physics.add.existing(this);
  }

  /**
   * オブジェクトの初期化処理を行います。
   * このメソッドは、オブジェクトが生成された後、特定の状態に設定するために呼び出されます。
   *
   * 設計思想:
   * コンストラクタはオブジェクトの「生成」に専念させ、状態の「初期化」は
   * このメソッドで行うことで、関心の分離を図っています。
   * 例えば、プレイヤーのHPを満タンにしたり、敵を特定の位置に配置したりする際に
   * 各サブクラスでこのメソッドをオーバーライドして具体的な処理を記述します。
   *
   * @param {unknown} [config] - 初期化に使用する設定データ（任意）。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public initialize(config?: unknown): void {
    // このメソッドは、具体的な処理を持たず、各サブクラス（Player, Enemyなど）で
    // それぞれの要件に合わせてオーバーライド（上書き）されることを想定しています。
  }
}
