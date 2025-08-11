import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/UIConstants';

export default class TitleScene extends Phaser.Scene {
  private menu!: Menu;

  constructor() {
    super('TitleScene');
  }

  preload() {
    // 背景画像を読み込み
    if (!this.textures.exists('background')) {
      this.load.image('background', 'assets/maps/background.png');
    }
  }

  create() {
    // 背景画像を追加
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');

    // レトロ風UIパネル作成
    const { panel } = RetroUI.createPanel(this, this.cameras.main.width / 2, this.cameras.main.height / 2, 400, 250);

    // タイトルテキスト
    RetroUI.createTitle(panel.scene, panel, 'レトロ・クイズ・アクション', -60);

    // メニュー作成
    this.menu = new Menu(this, {
      x: panel.x,
      y: panel.y,
      options: ['ゲームスタート'],
      fontSize: UIConstants.FontSize.Large,
      startY: 0,
    });

    // メニュー選択時のイベントリスナー
    this.menu.on('selected', (index: number) => {
      if (index === 0) {
        this.scene.start('StageSelectScene');
      }
    });

    // 操作説明
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      '↑/↓: 選択  Enter: 決定',
      40
    );
  }
}
