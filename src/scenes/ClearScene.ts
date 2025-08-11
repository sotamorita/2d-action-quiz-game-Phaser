import Phaser from 'phaser';
import { RetroUI } from '../ui/styles/RetroUI';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/styles/UIConstants';

interface ClearSceneData {
  stageId?: string;
  mapPath?: string;
  score?: number;
}

export default class ClearScene extends Phaser.Scene {
  private stageId!: string;
  private mapPath!: string;
  private score!: number;
  private menu!: Menu;

  // ショートカットキー
  private rKey?: Phaser.Input.Keyboard.Key;
  private tKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('ClearScene');
  }

  init(data: ClearSceneData) {
    this.stageId = data.stageId ?? 'level1';
    this.mapPath = data.mapPath ?? 'assets/maps/level1.json';
    this.score = data.score ?? 0;
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // レトロ風UIパネル作成
    const { panel } = RetroUI.createPanel(this, centerX, centerY, 400, 250);

    // メインタイトル「STAGE CLEAR!」
    const title = RetroUI.createTitle(panel.scene, panel, 'STAGE CLEAR!', -80);
    title.setColor(UIConstants.Color.Green);
    title.setFontSize(UIConstants.FontSize.Title);

    // スコア表示
    const scoreText = this.add.text(0, -30, `SCORE: ${this.score}`, {
      fontSize: '28px',
      fontFamily: UIConstants.FontFamily,
      color: UIConstants.Color.Yellow
    }).setOrigin(0.5);
    panel.add(scoreText);

    // メニュー作成
    this.menu = new Menu(this, {
      x: panel.x,                   // X座標
      y: panel.y,                   // Y座標
      options: ['再挑戦', 'タイトルへ戻る'],
      fontSize: UIConstants.FontSize.Large, // フォントサイズ
      startY: 20,                   // 開始Y座標（コンテナ中心からのオフセット）
      spacing: 35,                  // 各項目の間隔
    });

    // メニュー選択時のイベントリスナー
    this.menu.on('selected', (index: number) => {
      this.executeAction(index);
    });

    // ショートカットキー設定
    this.rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    this.rKey.on('down', () => this.executeAction(0));
    this.tKey.on('down', () => this.executeAction(1));

    // 操作説明
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      '↑/↓: 選択  Enter: 決定\nR: 再挑戦  T: タイトル',
      95, // Y座標
      {
        wordWrap: { width: 380 }, // 折り返し幅
        lineSpacing: 7.5,          // 行間
      }
    );

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
  }

  private executeAction(actionIndex: number) {
    switch (actionIndex) {
      case 0: // 再挑戦
        this.scene.start('GameScene', {
          stageId: this.stageId,
          mapPath: this.mapPath
        });
        break;
      case 1: // タイトルへ戻る
        this.scene.start('TitleScene');
        break;
    }
  }

  private cleanup() {
    // ショートカットキーのイベントを解除
    this.rKey?.off('down');
    this.tKey?.off('down');
  }
}
