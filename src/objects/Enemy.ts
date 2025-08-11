import BaseObject from './BaseObject';

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

export default class Enemy extends BaseObject {
  speed: number;
  health: number;
  damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig = {}) {
    super(scene, x, y, 'enemy');

    this.setImmovable(true);
    this.setCollideWorldBounds(true);

    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_ENEMY_CONFIG, ...config };

    this.speed = finalConfig.speed;
    this.health = finalConfig.health;
    this.damage = finalConfig.damage;
  }

  // プールから再利用される際に呼ばれる初期化メソッド
  public initialize(config: EnemyConfig = {}): void {
    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_ENEMY_CONFIG, ...config };
    this.speed = finalConfig.speed;
    this.health = finalConfig.health;
    this.damage = finalConfig.damage;

    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
    }
  }
}
