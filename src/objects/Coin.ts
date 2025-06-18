import Phaser from 'phaser';

export default class Coin extends Phaser.Physics.Arcade.Sprite {
  value: number;
  spinSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, properties: Record<string, any> = {}) {
    super(scene, x, y, 'coin');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.value = properties.value ?? 1;
    this.spinSpeed = properties.spinSpeed ?? 1;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);

    // コインのアニメーションやエフェクトがあればここで追加
  }
}
