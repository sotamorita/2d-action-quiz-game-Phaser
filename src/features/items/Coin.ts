import BaseObject from '../../core/game-objects/BaseObject';

// コインの基本性能をコードで定義
const COIN_VALUE = 1;
const COIN_SPIN_SPEED = 1;

export default class Coin extends BaseObject {
  readonly value: number;
  readonly spinSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'coin');

    this.value = COIN_VALUE;
    this.spinSpeed = COIN_SPIN_SPEED;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);
  }

  // プールから再利用される際に呼ばれる初期化メソッド
  public initialize(): void {
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
    }
  }
}
