import BaseObject from '../../core/game-objects/BaseObject';

/**
 * @constant CASTLE_LEVEL
 * @description この城がどのステージレベルに対応するかを示す値。
 */
const CASTLE_LEVEL = 1;

/**
 * @constant REQUIRED_KEYS
 * @description この城に入る（ステージをクリアする）ために必要な鍵の数。
 */
const REQUIRED_KEYS = 1;

/**
 * @class Castle
 * @description
 * ステージのゴール地点となる城オブジェクトを表すクラスです。
 * プレイヤーがこのオブジェクトに到達することで、ステージクリアとなります。
 *
 * [設計思想]
 * - **ゴール条件の定義**: このクラスは、`requiredKeys`のように、ステージクリアの条件となる
 *   データを保持する責務を担います。`CollisionSystem`は、プレイヤーと城の衝突を検知した際に、
 *   このオブジェクトのプロパティとプレイヤーの状態（例: `player.hasKey()`）を比較することで、
 *   クリア条件を満たしているかどうかを判定します。
 * - **拡張性**: `level`プロパティなどは、将来的に複数のステージや、より複雑なクリア条件を
 *   実装する際のスケーラビリティを考慮して設計されています。
 * - **基底クラスの活用**: 他のゲームオブジェクトと同様に`BaseObject`を継承することで、
 *   物理エンジンへの登録などの基本的な処理を共通化しています。
 *
 * @extends {BaseObject}
 */
export default class Castle extends BaseObject {
  /**
   * @property {number} level - 城のレベル。
   * @readonly
   */
  readonly level: number;

  /**
   * @property {number} requiredKeys - この城に入るために必要な鍵の数。
   * @readonly
   */
  readonly requiredKeys: number;

  /**
   * Castleクラスのインスタンスを生成します。
   * @param scene - このオブジェクトが属するシーン。
   * @param x - X座標。
   * @param y - Y座標。
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'castle');

    this.level = CASTLE_LEVEL;
    this.requiredKeys = REQUIRED_KEYS;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);
  }

  /**
   * オブジェクトプールから再利用される際に呼び出される初期化メソッドです。
   * （現在は特に処理はないが、将来的な拡張のためにメソッド自体は用意されています）
   */
  public initialize(): void {
    // 城のアニメーションやエフェクトがあればここで追加
  }
}
