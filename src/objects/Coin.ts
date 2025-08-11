import BaseObject from './BaseObject';

// Tiledから渡されるプロパティの型定義
export interface CoinConfig {
  value?: number;
  spinSpeed?: number;
}

// デフォルト値
const DEFAULT_COIN_CONFIG: Required<CoinConfig> = {
  value: 1,
  spinSpeed: 1,
};

export default class Coin extends BaseObject {
  value: number;
  spinSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: CoinConfig = {}) {
    super(scene, x, y, 'coin');

    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_COIN_CONFIG, ...config };

    this.value = finalConfig.value;
    this.spinSpeed = finalConfig.spinSpeed;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);
  }

  // プールから再利用される際に呼ばれる初期化メソッド
  public initialize(config: CoinConfig = {}): void {
    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_COIN_CONFIG, ...config };
    this.value = finalConfig.value;
    this.spinSpeed = finalConfig.spinSpeed;

    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
    }
  }
}
