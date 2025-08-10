import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';

interface GameOverSceneData {
  stageId: string;
  mapPath: string;
  score: number;
}

export default class GameOverScene extends Phaser.Scene {
  private stageId!: string;
  private mapPath!: string;
  private score!: number;
  private panel!: Phaser.GameObjects.Container;

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

  create() {
    // レトロ風UIパネル作成
    const { overlay, panel } = RetroUI.createPanel(this, 320, 200, 400, 320);
    this.panel = panel;

    // メインタイトル「GAME OVER」
    RetroUI.createTitle(this, this.panel, 'GAME OVER', -120, '48px', '#ff4444');

    // スコア表示
    this.add.text(0, -70, `SCORE: ${this.score}`, {
      fontSize: '32px',
      color: '#ffff00'
    }).setOrigin(0.5);
    this.panel.add(this.panel.list[this.panel.list.length - 1]);

    // 操作説明
    RetroUI.createInstructionText(
      this,
      this.panel,
      '操作:\nR - 再挑戦\nT - タイトルへ戻る',
      60,
      '20px'
    );

    // 将来のStageSelect対応用コメント
    // RetroUI.createInstructionText(
    //   this,
    //   this.panel,
    //   'M - ステージ選択',
    //   120,
    //   '20px'
    // );

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
