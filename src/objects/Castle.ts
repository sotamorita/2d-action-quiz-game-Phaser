import Phaser from 'phaser';

// Tiledから渡されるプロパティの型定義
export interface CastleConfig {
  level?: number;
  requiredKeys?: number;
}

// デフォルト値
const DEFAULT_CASTLE_CONFIG: Required<CastleConfig> = {
  level: 1,
  requiredKeys: 1,
};

export default class Castle extends Phaser.Physics.Arcade.Sprite {
  level: number;
  requiredKeys: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: CastleConfig = {}) {
    super(scene, x, y, 'castle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_CASTLE_CONFIG, ...config };

    this.level = finalConfig.level;
    this.requiredKeys = finalConfig.requiredKeys;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);

    // 城のアニメーションやエフェクトがあればここで追加
  }
}
