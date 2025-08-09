import Phaser from 'phaser';
import { CommonBackground } from '../ui/CommonBackground';

interface GameOverSceneData {
  stageId: string;
  mapPath: string;
  score: number;
}

export default class GameOverScene extends Phaser.Scene {
  private stageId!: string;
  private mapPath!: string;
  private score!: number;

  // キー入力ハンドラー（クリーンアップ用）
  private onRKey = () => {
    // 同ステージ再挑戦
    this.scene.start('GameScene', {
      stageId: this.stageId,
      mapPath: this.mapPath
    });
  };

  private onTKey = () => {
    // タイトルへ戻る
    this.scene.start('TitleScene');
  };

  // 将来のStageSelect対応用（TODO）
  // private onMKey = () => {
  //   this.scene.start('StageSelectScene');
  // };

  constructor() {
    super('GameOverScene');
  }

  init(data: any) {
    // データの型安全性チェック
    if (!data || typeof data.stageId !== 'string' || typeof data.mapPath !== 'string' || typeof data.score !== 'number') {
      console.warn('GameOverScene: Invalid data received', data);
      // デフォルト値設定
      this.stageId = 'level1';
      this.mapPath = 'assets/maps/level1.json';
      this.score = 0;
    } else {
      this.stageId = data.stageId;
      this.mapPath = data.mapPath;
      this.score = data.score;
    }
  }

  preload() {
    // 共通背景アセットを読み込み
    CommonBackground.preloadBackgroundAssets(this);
  }

  create() {
    // 共通背景描画
    CommonBackground.drawGameBackground(this);

    // メインタイトル「GAME OVER」
    this.add.text(320, 120, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff4444',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    // スコア表示
    this.add.text(320, 180, `SCORE: ${this.score}`, {
      fontSize: '32px',
      color: '#ffff00',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    // 操作説明
    this.add.text(320, 240, '操作:', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(320, 270, 'R - 再挑戦', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(320, 295, 'T - タイトルへ戻る', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    // 将来のStageSelect対応用コメント
    // this.add.text(320, 320, 'M - ステージ選択', {
    //   fontSize: '20px',
    //   color: '#ffffff',
    //   fontFamily: 'Arial'
    // }).setOrigin(0.5).setScrollFactor(0);

    // キー入力設定
    const rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    rKey.on('down', this.onRKey, this);
    tKey.on('down', this.onTKey, this);

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  private cleanup() {
    // キー入力ハンドラーの解除
    const rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    rKey.off('down', this.onRKey, this);
    tKey.off('down', this.onTKey, this);
  }
}
