import Phaser from 'phaser';

export default class Key extends Phaser.Physics.Arcade.Sprite {
  keyId: string;
  color: string;

  constructor(scene: Phaser.Scene, x: number, y: number, properties: Record<string, any> = {}) {
    super(scene, x, y, 'key');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.keyId = properties.keyId ?? '';
    this.color = properties.color ?? 'gold';

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);

    // キーのアニメーションやエフェクトがあればここで追加
  }
}
