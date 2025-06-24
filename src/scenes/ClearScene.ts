import Phaser from 'phaser';

export default class ClearScene extends Phaser.Scene {
  constructor() {
    super('ClearScene');
  }

  preload() {
  }

  create() {
    // クリアテキスト (標準フォント使用)
    this.add.text(400, 200, 'GAME CLEAR!', { fontSize: '64px', color: '#fff' })
      .setOrigin(0.5);

    // スコア表示 (GameSceneから渡されたデータを使用)
    const data = this.scene.settings.data as { score?: number };
    const score = data?.score || 0;
    this.add.text(400, 300, `SCORE: ${score}`, { fontSize: '32px', color: '#ff0' })
      .setOrigin(0.5);
  }
}
