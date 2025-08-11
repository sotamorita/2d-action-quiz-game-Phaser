import BaseObject from '../../core/game-objects/BaseObject';

// ハートの基本性能をコードで定義
const HEAL_AMOUNT = 1;

export default class Heart extends BaseObject {
  readonly healAmount: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'heart');

    this.healAmount = HEAL_AMOUNT;

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
