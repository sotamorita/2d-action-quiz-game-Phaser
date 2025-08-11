import Phaser from 'phaser';

// Tiledから渡されるプロパティの型定義
export interface EnemyConfig {
  speed?: number;
  health?: number;
  damage?: number;
}

// デフォルト値
const DEFAULT_ENEMY_CONFIG: Required<EnemyConfig> = {
  speed: 100,
  health: 3,
  damage: 1,
};

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  speed: number;
  health: number;
  damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig = {}) {
    super(scene, x, y, 'enemy');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setCollideWorldBounds(true);

    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_ENEMY_CONFIG, ...config };

    this.speed = finalConfig.speed;
    this.health = finalConfig.health;
    this.damage = finalConfig.damage;
  }
}
