import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/UIConstants';

export default class QuizCategorySelectScene extends Phaser.Scene {
  private menu!: Menu;
  private escKey?: Phaser.Input.Keyboard.Key;
  // 将来的にquiz_db.jsonから動的にカテゴリを取得することを想定
  private quizCategories = [{ id: 'general', name: 'すべての問題' }];

  constructor() {
    super({ key: 'QuizCategorySelectScene' });
  }

  preload() {
    if (!this.textures.exists('background')) {
      this.load.image('background', 'assets/maps/background.png');
    }
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.image(centerX, centerY, 'background');

    const { panel } = RetroUI.createPanel(this, centerX, centerY, 400, 250);

    RetroUI.createTitle(panel.scene, panel, 'クイズ選択', -60);

    this.menu = new Menu(this, {
      x: panel.x,                   // X座標
      y: panel.y,                   // Y座標
      options: this.quizCategories.map(c => c.name),
      fontSize: UIConstants.FontSize.Large, // フォントサイズ
      startY: 0,                    // 開始Y座標（コンテナ中心からのオフセット）
    });

    this.menu.on('selected', (index: number) => {
      this.selectCategory(index);
    });

    RetroUI.createInstructionText(
      panel.scene,
      panel,
      'Enter: 決定  Esc: タイトルに戻る',
      100, // Y座標
      { lineSpacing: 10 } // 行間
    );

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.scene.start('TitleScene'));

    this.events.once('shutdown', this.cleanup, this);
  }

  private selectCategory(index: number) {
    if (index < 0 || index >= this.quizCategories.length) return;
    const selectedCategory = this.quizCategories[index];

    // 選択したカテゴリをRegistryに保存
    this.registry.set('selectedQuizCategory', selectedCategory.id);
    console.log(`Set quiz category to: ${selectedCategory.id}`);

    // タイトルシーンに戻る
    this.scene.start('TitleScene');
  }

  private cleanup() {
    this.escKey?.off('down');
  }
}
