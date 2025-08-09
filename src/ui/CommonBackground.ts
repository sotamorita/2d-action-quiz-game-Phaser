import Phaser from 'phaser';

export class CommonBackground {
  /**
   * GameSceneと同じ背景・地面を描画する共通関数
   * @param scene 描画対象のシーン
   */
  static drawGameBackground(scene: Phaser.Scene): void {
    // 背景描画
    const background = scene.add.tileSprite(0, 80, 1600, 320, 'background');
    background.setOrigin(0, 0);

    // 地面描画（GameSceneと同じ配置）
    const GROUND_Y = 380;
    for (let x = 200; x <= 1400; x += 400) {
      scene.add.image(x, GROUND_Y, 'ground').setScale(2);
    }
  }

  /**
   * 背景・地面用のアセットをpreloadする共通関数
   * @param scene preload対象のシーン
   */
  static preloadBackgroundAssets(scene: Phaser.Scene): void {
    scene.load.image('background', 'assets/maps/background.png');
    scene.load.image('ground', 'assets/platform.png');
  }
}
