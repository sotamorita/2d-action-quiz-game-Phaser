import BaseObject from '../../core/game-objects/BaseObject';

// 城の基本性能をコードで定義
const CASTLE_LEVEL = 1;
const REQUIRED_KEYS = 1;

export default class Castle extends BaseObject {
  readonly level: number;
  readonly requiredKeys: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'castle');

    this.level = CASTLE_LEVEL;
    this.requiredKeys = REQUIRED_KEYS;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);
  }

  public initialize(): void {
    // 城のアニメーションやエフェクトがあればここで追加
  }
}
