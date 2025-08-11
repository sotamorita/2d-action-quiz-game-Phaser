import Phaser from 'phaser';
import WebFont from 'webfontloader';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // WebFont Loaderを使用してGoogle Fontsを読み込む
    WebFont.load({
      google: {
        families: ['DotGothic16']
      },
      active: () => {
        // フォントが読み込み完了したら、次のシーンへ進む
        this.scene.start('TitleScene');
      }
    });
  }
}
