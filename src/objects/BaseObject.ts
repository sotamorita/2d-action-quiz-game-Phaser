import Phaser from 'phaser';

/**
 * すべてのゲームオブジェクトの基底クラス
 * 共通の初期化処理をまとめる
 */
export default class BaseObject extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public initialize(config?: unknown): void {
    // 各サブクラスでオーバーライドされる
  }
}
