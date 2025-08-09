import Phaser from 'phaser';

export default class ClearScene extends Phaser.Scene {
  constructor() {
    super('ClearScene');
  }

  preload() {
  }

  create() {
    // クリアテキスト (標準フォント使用)
    this.add.text(320, 150, 'GAME CLEAR!', { fontSize: '48px', color: '#fff' })
      .setOrigin(0.5);

    // スコア表示 (GameSceneから渡されたデータを使用)
    const data = this.scene.settings.data as { score?: number };
    const score = data?.score || 0;
    this.add.text(320, 220, `SCORE: ${score}`, { fontSize: '24px', color: '#ff0' })
      .setOrigin(0.5);
  }
}
