import Phaser from 'phaser';
import { CommonBackground } from '../ui/CommonBackground';

export default class StageSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private stages = [{ id: 'level1', name: 'レベル１', mapPath: 'assets/maps/level1.json' }];

  // キー入力ハンドラー（クリーンアップ用）
  private onUpKey = () => {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    this.updateMenuHighlight();
  };

  private onDownKey = () => {
    this.selectedIndex = Math.min(this.stages.length - 1, this.selectedIndex + 1);
    this.updateMenuHighlight();
  };

  private onEnterKey = () => {
    const selectedStage = this.stages[this.selectedIndex];
    // ステージ開始（データを渡す）
    this.scene.start('GameScene', {
      stageId: selectedStage.id,
      mapPath: selectedStage.mapPath
    });
  };

  private on1Key = () => {
    // 1キーで直接レベル1を選択
    if (this.stages.length > 0) {
      this.selectedIndex = 0;
      this.updateMenuHighlight();
    }
  };

  private onEscKey = () => {
    // タイトルに戻る
    this.scene.start('TitleScene');
  };

  constructor() {
    super('StageSelectScene');
  }

  preload() {
    // テクスチャ存在チェック
    if (!this.textures.exists('ground')) {
      this.load.image('ground', 'assets/platform.png');
    }
    if (!this.textures.exists('background')) {
      this.load.image('background', 'assets/maps/background.png');
    }
  }

  create() {
    // 初期化：配列をクリア
    this.menuItems = [];
    this.selectedIndex = 0;

    // 共通背景描画
    CommonBackground.drawGameBackground(this);

    // タイトルテキスト
    const titleText = this.add.text(320, 120, 'ステージセレクト', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    // メニュー作成
    this.createMenu();

    // 操作説明
    const instructionText = this.add.text(320, 320, '↑/↓: 移動  1: 直接選択  Enter: 決定  Esc: タイトルに戻る', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    // キー入力設定
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const oneKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);

    upKey.on('down', this.onUpKey, this);
    downKey.on('down', this.onDownKey, this);
    enterKey.on('down', this.onEnterKey, this);
    escKey.on('down', this.onEscKey, this);
    oneKey.on('down', this.on1Key, this);

    // 初期ハイライト設定（メニュー作成後に実行）
    this.updateMenuHighlight();

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  private createMenu() {
    const startY = 200;
    const spacing = 40;

    this.stages.forEach((stage, index) => {
      const menuText = this.add.text(320, startY + (index * spacing), stage.name, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0);

      this.menuItems.push(menuText);
    });
  }

  private updateMenuHighlight() {
    // メニューアイテムが存在しない場合は何もしない
    if (!this.menuItems || this.menuItems.length === 0) {
      return;
    }

    this.menuItems.forEach((item, index) => {
      // アイテムが有効かチェック
      if (!item || !item.active) {
        return;
      }

      if (index === this.selectedIndex) {
        // 選択中：黄色背景 + 黒文字
        item.setStyle({
          fontSize: '24px',
          color: '#000000',
          backgroundColor: '#ffff00',
          padding: { x: 10, y: 5 }
        });
      } else {
        // 非選択：白文字
        item.setStyle({
          fontSize: '24px',
          color: '#ffffff',
          backgroundColor: 'transparent',
          padding: { x: 0, y: 0 }
        });
      }
    });
  }

  private cleanup() {
    // キー入力ハンドラーの解除
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const oneKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);

    upKey.off('down', this.onUpKey, this);
    downKey.off('down', this.onDownKey, this);
    enterKey.off('down', this.onEnterKey, this);
    escKey.off('down', this.onEscKey, this);
    oneKey.off('down', this.on1Key, this);
  }
}
