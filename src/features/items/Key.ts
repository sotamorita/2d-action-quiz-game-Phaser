import BaseObject from '../../core/game-objects/BaseObject';

// Tiledから渡されるプロパティの型定義
export interface KeyConfig {
  keyId?: string;
  color?: string;
}

// デフォルト値
const DEFAULT_KEY_CONFIG: Required<KeyConfig> = {
  keyId: 'default_key',
  color: 'gold',
};

export default class Key extends BaseObject {
  keyId: string;
  color: string;

  constructor(scene: Phaser.Scene, x: number, y: number, config: KeyConfig = {}) {
    super(scene, x, y, 'key');

    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_KEY_CONFIG, ...config };

    this.keyId = finalConfig.keyId;
    this.color = finalConfig.color;

    this.setOrigin(0.5, 0.5);
    this.setImmovable(true);
  }

  // プールから再利用される際に呼ばれる初期化メソッド
  public initialize(config: KeyConfig = {}): void {
    // デフォルト値とTiledからの設定をマージ
    const finalConfig = { ...DEFAULT_KEY_CONFIG, ...config };
    this.keyId = finalConfig.keyId;
    this.color = finalConfig.color;

    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
    }
  }
}
