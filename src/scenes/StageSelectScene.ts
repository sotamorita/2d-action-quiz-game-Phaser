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

    this.menu = new Menu(this, {
      x: panel.x,
      y: panel.y,
      options: this.stages.map(s => s.name),
      fontSize: UIConstants.FontSize.Large,
      startY: 0,
    });

    this.menu.on('selected', (index: number) => {
      this.selectStage(index);
    });

    // 操作説明
    const instructions = [
      '↑/↓: 移動',
      '1: 直接選択',
      'Enter: 決定',
      'Esc: タイトルに戻る'
    ];
    instructions.forEach((text, index) => {
      RetroUI.createInstructionText(panel.scene, panel, text, 40 + index * 20);
    });

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
