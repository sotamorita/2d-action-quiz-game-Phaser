import Phaser from 'phaser';
import WebFontLoader from 'webfontloader';

const MIN_LOADING_TIME = 2000; // 最低ローディング時間（ミリ秒）

export default class PreloadScene extends Phaser.Scene {
  private startTime = 0;
  private spinner!: Phaser.GameObjects.Graphics;

  constructor() {
    super('PreloadScene');
  }

  init() {
    this.startTime = this.time.now;
  }

  preload() {
    // Webフォントの読み込みを非同期で開始
    let fontsReady = false;
    WebFontLoader.load({
      google: {
        families: ['DotGothic16']
      },
      active: () => {
        fontsReady = true;
      },
      inactive: () => {
        console.warn('Font could not be loaded, proceeding with fallback.');
        fontsReady = true; // フォント失敗時も進行
      }
    });

    // Phaserのアセット読み込みを並行して開始
    this.loadAssets();

    // すべての読み込みが完了したらTitleSceneへ
    this.load.on('complete', () => {
      const elapsedTime = this.time.now - this.startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;

      const startNextScene = () => {
        this.scene.start('TitleScene');
      };

      if (remainingTime > 0) {
        this.time.delayedCall(remainingTime, startNextScene);
      } else {
        startNextScene();
      }
    });
  }

  create() {
    this.createSpinner();
  }

  update() {
    if (this.spinner) {
      this.spinner.rotation += 0.05;
    }
  }

  private loadAssets() {
    // Player spritesheet
    this.load.spritesheet('player', 'assets/player/player.png', {
      frameWidth: 32,
      frameHeight: 48
    });

    // Images
    this.load.image('background', 'assets/maps/background.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('key', 'assets/key.png');
    this.load.image('castle', 'assets/castle.png');
    this.load.image('heart', 'assets/heart.png');

    // Map JSONs
    this.load.json('level1', 'assets/maps/level1.json');

    // Quiz data
    this.load.json('quiz_db', 'assets/quiz/quiz_db.json');
  }

  private createSpinner() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 「読み込み中...」テキスト
    this.add
      .text(centerX, centerY - 40, '読み込み中...', {
        font: '20px DotGothic16',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    // スピナー（回転する円弧）
    this.spinner = this.add.graphics({
      x: centerX,
      y: centerY + 20
    });
    this.spinner.lineStyle(4, 0xffffff, 1);
    this.spinner.beginPath();
    this.spinner.arc(0, 0, 20, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(270), false);
    this.spinner.strokePath();
  }
}
