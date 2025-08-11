import Phaser from 'phaser';

export default class QuizOnlyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizOnlyScene' });
  }

  create() {
    this.add.text(this.cameras.main.width / 2, 50, 'クイズモード', { fontSize: '32px' }).setOrigin(0.5);
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '（このシーンは未実装です）', { fontSize: '24px' }).setOrigin(0.5);

    // タイトルに戻る機能
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 50, 'クリックでタイトルに戻る', { fontSize: '16px' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('TitleScene');
      });
  }
}
