import BaseObject from '../../core/game-objects/BaseObject';

// 鍵の基本性能をコードで定義
const KEY_ID = 'default_key';
const KEY_COLOR = 'gold';

export default class Key extends BaseObject {
  readonly keyId: string;
  readonly color: string;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'key');

    this.keyId = KEY_ID;
    this.color = KEY_COLOR;

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
