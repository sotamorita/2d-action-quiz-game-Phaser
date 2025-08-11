import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/UIConstants';

export default class StageSelectScene extends Phaser.Scene {
  private stages = [{ id: 'level1', name: 'レベル１', mapPath: 'assets/maps/level1.json' }];
  private menu!: Menu;

  // ショートカットキー
  private escKey?: Phaser.Input.Keyboard.Key;
  private oneKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('StageSelectScene');
  }

  preload() {
    if (!this.textures.exists('background')) {
      this.load.image('background', 'assets/maps/background.png');
    }
    if (!this.textures.exists('ground')) {
      this.load.image('ground', 'assets/platform.png');
    }
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.image(centerX, centerY, 'background');

    const { panel } = RetroUI.createPanel(this, centerX, centerY, 400, 250);

    RetroUI.createTitle(panel.scene, panel, 'ステージセレクト', -60);

    // メニュー作成
    this.menu = new Menu(this, {
      x: panel.x,                   // X座標
      y: panel.y,                   // Y座標
      options: this.stages.map(s => s.name),
      fontSize: UIConstants.FontSize.Large, // フォントサイズ
      startY: 0,                    // 開始Y座標（コンテナ中心からのオフセット）
    });

    this.menu.on('selected', (index: number) => {
      this.selectStage(index);
    });

    // 操作説明
    const instructionText = '↑/↓: 移動\n1: 直接選択\nEnter: 決定\nEsc: タイトルに戻る';
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      instructionText,
      70, // Y座標
      { lineSpacing: 8 } // 行間
    );

    // ショートカットキー設定
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.oneKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);

    this.escKey.on('down', () => this.scene.start('TitleScene'));
    this.oneKey.on('down', () => this.selectStage(0));

    this.events.once('shutdown', this.cleanup, this);
  }

  private selectStage(index: number) {
    if (index < 0 || index >= this.stages.length) return;
    const selectedStage = this.stages[index];
    this.scene.start('GameScene', {
      stageId: selectedStage.id,
      mapPath: selectedStage.mapPath
    });
  }

  private cleanup() {
    this.escKey?.off('down');
    this.oneKey?.off('down');
  }
}
