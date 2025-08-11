import BaseObject from '../../core/game-objects/BaseObject';

// 敵の基本性能をコードで定義
const ENEMY_SPEED = 100;
const ENEMY_HEALTH = 3;
const ENEMY_DAMAGE = 1;

export default class Enemy extends BaseObject {
  readonly speed: number;
  health: number;
  readonly damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy');

    this.setImmovable(true);
    this.setCollideWorldBounds(true);

    this.speed = ENEMY_SPEED;
    this.health = ENEMY_HEALTH;
    this.damage = ENEMY_DAMAGE;
  }

  // プールから再利用される際に呼ばれる初期化メソッド
  public initialize(): void {
    this.health = ENEMY_HEALTH;
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
    }
  }
}
