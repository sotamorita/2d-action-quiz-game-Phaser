import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';

export default class StageSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private stages = [{ id: 'level1', name: 'レベル１', mapPath: 'assets/maps/level1.json' }];
  private panel!: Phaser.GameObjects.Container;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private escKey?: Phaser.Input.Keyboard.Key;
  private oneKey?: Phaser.Input.Keyboard.Key;

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
    // 1キーで直接レベル1を選択して開始
    if (this.stages.length > 0) {
      const selectedStage = this.stages[0]; // レベル1を直接選択
      this.scene.start('GameScene', {
        stageId: selectedStage.id,
        mapPath: selectedStage.mapPath
      });
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
    // 背景画像を読み込み
    if (!this.textures.exists('background')) {
      this.load.image('background', 'assets/maps/background.png');
    }
    // テクスチャ存在チェック（RetroUIは背景を扱わないため、CommonBackgroundのプリロードは不要）
    if (!this.textures.exists('ground')) {
      this.load.image('ground', 'assets/platform.png');
    }
  }

  create() {
    // 初期化：配列をクリア
    this.menuItems = [];
    this.selectedIndex = 0;

    // 背景画像を追加
    this.add.image(320, 160, 'background');

    // レトロ風UIパネル作成（アルファ値を0.7に変更）
    const { overlay, panel } = RetroUI.createPanel(this, 320, 160, 400, 250, 0.7); // 高さを250に調整、アルファ値を0.7に
    this.panel = panel;

    // タイトルテキスト
    RetroUI.createTitle(this, this.panel, 'ステージセレクト', -60, '28px'); // Y座標を-60に調整

    // メニューアイテム作成
    this.menuItems = RetroUI.createMenuItems(
      this,
      this.stages.map(s => s.name),
      this.panel,
      0, // Y座標を0に調整
      40,
      '24px'
    );

    // メニュー項目にタップイベントを追加
    this.menuItems.forEach((item, index) => {
      item.setInteractive({ useHandCursor: true });
      item.on('pointerdown', () => {
        this.selectedIndex = index;
        this.updateMenuHighlight();
        this.onEnterKey(); // タップで即時決定
      });
    });

    // 操作説明
    // 以前の単一のテキストを分割し、それぞれを独立したテキストオブジェクトとして作成
    RetroUI.createInstructionText(
      this,
      this.panel,
      '↑/↓: 移動',
      40, // 最初の行のY座標を40に調整
      '14px',
      '#cccccc',
      380
    );
    RetroUI.createInstructionText(
      this,
      this.panel,
      '1: 直接選択',
      60, // 2行目のY座標を60に調整
      '14px',
      '#cccccc',
      380
    );
    RetroUI.createInstructionText(
      this,
      this.panel,
      'Enter: 決定',
      80, // 3行目のY座標を80に調整
      '14px',
      '#cccccc',
      380
    );
    RetroUI.createInstructionText(
      this,
      this.panel,
      'Esc: タイトルに戻る',
      100, // 4行目のY座標を100に調整
      '14px',
      '#cccccc',
      380
    );

    // キー入力設定
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.oneKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);

    this.upKey.on('down', this.onUpKey, this);
    this.downKey.on('down', this.onDownKey, this);
    this.enterKey.on('down', this.onEnterKey, this);
    this.escKey.on('down', this.onEscKey, this);
    this.oneKey.on('down', this.on1Key, this);

    // 初期ハイライト設定（メニュー作成後に実行）
    this.updateMenuHighlight();

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  private updateMenuHighlight() {
    RetroUI.updateSelection(this.menuItems, this.selectedIndex, this.stages.map(s => s.name));
  }

  private cleanup() {
    // キー入力ハンドラーの解除
    this.upKey?.off('down', this.onUpKey, this);
    this.downKey?.off('down', this.onDownKey, this);
    this.enterKey?.off('down', this.onEnterKey, this);
    this.escKey?.off('down', this.onEscKey, this);
    this.oneKey?.off('down', this.on1Key, this);

    // メニュー項目のイベントリスナーをクリーンアップ
    this.menuItems.forEach(item => {
      item.off('pointerdown');
    });
  }
}
