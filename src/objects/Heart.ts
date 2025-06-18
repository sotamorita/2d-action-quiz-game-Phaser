import Phaser from 'phaser';

export default class Heart extends Phaser.Physics.Arcade.Sprite {
  healAmount: number;

  constructor(scene: Phaser.Scene, x: number, y: number, properties: Record<string, any> = {}) {
    super(scene, x, y, 'heart');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.healAmount = properties.healAmount ?? 1;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);

    // アニメーションやエフェクトがあればここで追加
  }
}
