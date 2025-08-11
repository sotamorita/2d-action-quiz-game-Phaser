import Phaser from 'phaser';
import WebFontLoader from 'webfontloader';

// 最低でもこの時間だけはローディング画面を表示する（ミリ秒）。
// 読み込みが一瞬で終わると、画面がちらついて見えるのを防ぐためのUX改善策。
const MIN_LOADING_TIME = 1500;

/**
 * @class PreloadScene
 * @extends Phaser.Scene
 * @description
 * ゲーム全体で使用するアセット（画像、スプライトシート、JSONデータ、Webフォントなど）を
 * 一括で読み込むためのシーン。
 *
 * 設計思想:
 * 1. **責務の集中**: アセット読み込みのロジックをこのシーンに集約することで、
 *    他のシーンはアセットが既に利用可能な状態であることを前提に動作できます。
 * 2. **非同期処理の管理**: WebフォントとPhaserのアセットという、2種類の非同期読み込みを
 *    並行して行い、すべてが完了した時点で次のシーンに遷移するよう制御しています。
 * 3. **UXへの配慮**: ローディングスピナーを表示することで、ユーザーに処理中であることを
 *    明確に伝えます。また、`MIN_LOADING_TIME`を設けることで、読み込みが速すぎる場合でも
 *    「ローディング画面が一瞬表示されて消える」という不自然な体験を防いでいます。
 */
export default class PreloadScene extends Phaser.Scene {
  private startTime = 0; // ローディング開始時間
  private spinner!: Phaser.GameObjects.Graphics; // スピナーのグラフィックスオブジェクト

  constructor() {
    super('PreloadScene');
  }

  /**
   * シーンの初期化処理。ローディング開始時間を記録します。
   */
  init() {
    this.startTime = this.time.now;
  }

  /**
   * アセットの読み込み処理。Phaserのライフサイクルで自動的に呼び出されます。
   */
  preload() {
    // Webフォントの非同期読み込みを開始
    WebFontLoader.load({
      google: {
        families: ['DotGothic16'] // Google FontsからDotGothic16を読み込む
      },
      active: () => {
        // フォント読み込み成功時の処理（ここでは何もしない）
      },
      inactive: () => {
        // フォント読み込み失敗時も、ゲームが停止しないように警告のみ表示して続行
        console.warn('Font could not be loaded, proceeding with fallback.');
      }
    });

    // Phaserの機能で他のアセット読み込みを並行して開始
    this.loadAssets();

    // すべてのアセット読み込みが完了したときのイベントリスナー
    this.load.on('complete', () => {
      const elapsedTime = this.time.now - this.startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;

      const startNextScene = () => {
        this.scene.start('TitleScene'); // TitleSceneへ移行
      };

      // 最低ローディング時間に満たない場合は、差分時間だけ待ってから次へ
      if (remainingTime > 0) {
        this.time.delayedCall(remainingTime, startNextScene);
      } else {
        startNextScene();
      }
    });
  }

  /**
   * シーン生成時に呼び出される処理。ローディングスピナーを作成します。
   */
  create() {
    this.createSpinner();
  }

  /**
   * 毎フレーム呼び出される更新処理。スピナーを回転させます。
   */
  update() {
    if (this.spinner) {
      this.spinner.rotation += 0.05;
    }
  }

  /**
   * ゲームで必要なアセットをすべて読み込みます。
   */
  private loadAssets() {
    // スプライトシート
    this.load.spritesheet('player', 'assets/player/player.png', {
      frameWidth: 32,
      frameHeight: 48
    });

    // 画像
    this.load.image('background', 'assets/maps/background.png');
    this.load.image('background-dessert', 'assets/maps/background-dessert.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('key', 'assets/key.png');
    this.load.image('castle', 'assets/castle.png');
    this.load.image('heart', 'assets/heart.png');

    // マップデータ (JSON)
    this.load.json('level1', 'assets/maps/level1.json');
    this.load.json('level2', 'assets/maps/level2.json');

    // クイズデータ (JSON)
    this.load.json('quiz_db', 'assets/quiz/quiz_db.json');
  }

  /**
   * 「読み込み中...」テキストと回転するスピナーを作成します。
   */
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

    // スピナー（回転する円弧）の描画
    this.spinner = this.add.graphics({
      x: centerX,
      y: centerY + 20
    });
    this.spinner.lineStyle(4, 0xffffff, 1); // 線のスタイル（太さ4, 色白, 透明度1）
    this.spinner.beginPath();
    // 円弧を描画（中心0,0, 半径20, 開始角度0度, 終了角度270度, 反時計回りfalse）
    this.spinner.arc(0, 0, 20, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(270), false);
    this.spinner.strokePath(); // 線を描画
  }
}
