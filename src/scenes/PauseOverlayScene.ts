import Phaser from 'phaser';
import { RetroUI } from '../ui/styles/RetroUI';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/styles/UIConstants';

export default class PauseOverlayScene extends Phaser.Scene {
  private stageId?: string;
  private mapPath?: string;
  private returnScene?: string;
  private menu!: Menu;

  // ショートカットキー
  private escKey?: Phaser.Input.Keyboard.Key;
  private rKey?: Phaser.Input.Keyboard.Key;
  private tKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('PauseOverlayScene');
  }

  init(data: { stageId?: string; mapPath?: string; returnScene?: string }) {
    this.stageId = data.stageId;
    this.mapPath = data.mapPath;
    this.returnScene = data.returnScene;
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // レトロ風UIパネル作成
    const { panel } = RetroUI.createPanel(this, centerX, centerY, 350, 280);

    // タイトルテキスト
    RetroUI.createTitle(panel.scene, panel, 'ポーズ', -80);

    // メニュー作成
    this.menu = new Menu(this, {
      x: panel.x,                   // X座標
      y: panel.y,                   // Y座標
      options: ['コンティニュー', 'リトライ', 'タイトルへ戻る'],
      fontSize: UIConstants.FontSize.Large, // フォントサイズ
      startY: -20,                  // 開始Y座標（コンテナ中心からのオフセット）
      spacing: 35,                  // 各項目の間隔
    });

    // メニュー選択時のイベントリスナー
    this.menu.on('selected', (index: number) => {
      this.executeAction(index);
    });

    // ショートカットキー設定
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    this.escKey.on('down', () => this.executeAction(0));
    this.rKey.on('down', () => this.executeAction(1));
    this.tKey.on('down', () => this.executeAction(2));

    // 操作説明
    const instructionText = '↑/↓: 選択  Enter: 決定\nESC: コンティニュー  R: リトライ  T: タイトル';
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      instructionText,
      90, // Y座標
      { lineSpacing: 10 } // 行間
    );

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
  }

  private executeAction(actionIndex: number) {
    switch (actionIndex) {
      case 0: // コンティニュー
        this.scene.resume(this.returnScene || 'GameScene');
        this.scene.stop();
        break;
      case 1: // リトライ
        this.scene.stop(this.returnScene || 'GameScene');
        this.scene.start('GameScene', {
          stageId: this.stageId,
          mapPath: this.mapPath
        });
        this.scene.stop(); // ポーズシーン自身を停止
        break;
      case 2: // タイトルへ戻る
        this.scene.stop(this.returnScene || 'GameScene');
        this.scene.start('TitleScene');
        this.scene.stop(); // ポーズシーン自身を停止
        break;
    }
  }

  private cleanup() {
    // ショートカットキーのイベントを解除
    this.escKey?.off('down');
    this.rKey?.off('down');
    this.tKey?.off('down');
    // Menuオブジェクトは自身のdestroyメソッドでイベントを解除するので、ここでは不要
  }
}
