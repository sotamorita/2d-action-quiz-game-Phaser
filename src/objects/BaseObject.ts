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

  /**
   * シーンに配置された後に呼び出される初期化処理
   * アニメーションの再生など、他のオブジェクトや設定に依存する処理をここに記述する
   */
  public initialize(): void {
    // 各派生クラスで必要に応じてオーバーライドする
  }
}
