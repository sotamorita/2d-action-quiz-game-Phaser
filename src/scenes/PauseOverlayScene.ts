import Phaser from 'phaser';

export default class PauseOverlayScene extends Phaser.Scene {
  private stageId?: string;
  private mapPath?: string;
  private returnScene?: string;

  // キー入力ハンドラー（クリーンアップ用）
  private onEscKey = () => {
    // GameSceneを再開
    this.scene.resume('GameScene');
    // オーバーレイを閉じる
    this.scene.stop();
  };

  private onRKey = () => {
    // リトライ：まずGameSceneを再開してから停止
    this.scene.resume('GameScene');
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('GameScene', {
      stageId: this.stageId,
      mapPath: this.mapPath
    });
  };

  private onTKey = () => {
    // タイトルへ戻る：まずGameSceneを再開してから停止
    this.scene.resume('GameScene');
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('TitleScene');
  };

  constructor() {
    super('PauseOverlayScene');
  }

  init(data: { stageId?: string; mapPath?: string; returnScene?: string }) {
    // データを受け取り
    this.stageId = data.stageId;
    this.mapPath = data.mapPath;
    this.returnScene = data.returnScene;
  }

  create() {
    // 半透明ブラックの全画面オーバーレイ
    const overlay = this.add.rectangle(320, 200, 640, 400, 0x000000, 0.7);
    overlay.setScrollFactor(0);

    // 中央に「ポーズ」テキスト
    const pauseText = this.add.text(320, 150, 'ポーズ', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    // 操作説明テキスト
    const instructionText = this.add.text(320, 220, 'ESC: コンティニュー  /  R: リトライ  /  T: タイトル', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    // キー入力設定
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    escKey.on('down', this.onEscKey, this);
    rKey.on('down', this.onRKey, this);
    tKey.on('down', this.onTKey, this);

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  private cleanup() {
    // キー入力ハンドラーの解除
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    escKey.off('down', this.onEscKey, this);
    rKey.off('down', this.onRKey, this);
    tKey.off('down', this.onTKey, this);
  }
}
