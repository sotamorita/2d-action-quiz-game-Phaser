import Phaser from 'phaser';
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
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 背景画像を追加
    this.add.image(centerX, centerY, 'background');

    // 半透明のオーバーレイを追加
    this.add.rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      UIConstants.Overlay.BgColor,
      0.4 // Alpha値を少し下げる
    );

    // タイトルテキスト
    this.add.text(centerX, centerY - 80, '2Dアクション・クイズゲーム', {
      fontFamily: UIConstants.FontFamily,
      fontSize: '38px',
      color: UIConstants.Color.White,
      stroke: UIConstants.Color.Black,
      strokeThickness: 8,
      shadow: {
        offsetX: 5,
        offsetY: 5,
        color: '#000',
        blur: 5,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);

    // メニュー作成
    this.menu = new Menu(this, {
      x: centerX,
      y: centerY + 40,
      options: ['ゲームスタート', 'クイズ選択'],
      fontSize: UIConstants.FontSize.Large,
      startY: 0,
      spacing: 50,
      highlightColor: UIConstants.Color.White,
      highlightTextColor: UIConstants.Color.Black,
    });

    // メニュー選択時のイベントリスナー
    this.menu.on('selected', (index: number) => {
      if (index === 0) {
        // ステージセレクトへ
        this.scene.start('StageSelectScene');
      } else if (index === 1) {
        // クイズ選択シーンへ
        this.scene.start('QuizCategorySelectScene');
      }
    });
  }
}
