import Phaser from 'phaser';

export default class Castle extends Phaser.Physics.Arcade.Sprite {
  level: number;
  requiredKeys: number;

  constructor(scene: Phaser.Scene, x: number, y: number, properties: Record<string, any> = {}) {
    super(scene, x, y, 'castle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.level = properties.level ?? 1;
    this.requiredKeys = properties.requiredKeys ?? 1;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);

    // 城のアニメーションやエフェクトがあればここで追加
  }
}
