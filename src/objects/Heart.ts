import Phaser from 'phaser';

// Tiledから渡されるプロパティの型定義
export interface HeartConfig {
  healAmount?: number;
}

// デフォルト値
const DEFAULT_HEART_CONFIG: Required<HeartConfig> = {
  healAmount: 1,
};

export default class Heart extends Phaser.Physics.Arcade.Sprite {
  healAmount: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: HeartConfig = {}) {
    super(scene, x, y, 'heart');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_HEART_CONFIG, ...config };

    this.healAmount = finalConfig.healAmount;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);

    // アニメーションやエフェクトがあればここで追加
  }
}
