import Phaser from 'phaser';

export default class QuizScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private choices = ['1', '2', '3', '4'];
  private correctAnswer = '4';
  private enemy!: Phaser.GameObjects.GameObject;
  private returnSceneKey!: string;

  constructor() {
    super({ key: 'QuizScene' });
  }

  create(data: { enemy: Phaser.GameObjects.GameObject; returnSceneKey: string }) {
    this.enemy = data.enemy;
    this.returnSceneKey = data.returnSceneKey;

    // 状態をリセット
    this.selectedIndex = 0;
    this.choiceTexts = [];

    // キーボード入力を有効化
    this.input.keyboard!.enabled = true;

    // 背景のオーバーレイ
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);

    // 問題文（仮固定）
    this.add.text(400, 160, '2 + 2 = ?', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 選択肢を表示
    this.choices.forEach((choice, i) => {
      const text = this.add.text(400, 240 + i * 48, choice, {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5);
      this.choiceTexts.push(text);
    });

    // 即時に選択状態を更新
    this.updateSelection();

    // キー入力設定
    this.input.keyboard!.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex + this.choices.length - 1) % this.choices.length;
      this.updateSelection();
    });

    this.input.keyboard!.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.choices.length;
      this.updateSelection();
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      this.confirmAnswer();
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.confirmAnswer();
    });
  }

  updateSelection() {
    this.choiceTexts.forEach((text, i) => {
      // テキストオブジェクトが有効かどうかチェック
      if (!text.scene || !text.active) return;
      if (i === this.selectedIndex) {
        text.setStyle({ backgroundColor: '#ffff00', color: '#000000' }); // 選択中：黄色
      } else {
        text.setStyle({ backgroundColor: 'rgba(0,0,0,0)', color: '#ffffff' }); // 非選択：透明背景
      }
    });
  }

  confirmAnswer() {
    const selected = this.choices[this.selectedIndex];
    const isCorrect = selected === this.correctAnswer;

    // イベントリスナーをクリーンアップ
    this.input.keyboard?.off('keydown-UP');
    this.input.keyboard?.off('keydown-DOWN');
    this.input.keyboard?.off('keydown-ENTER');
    this.input.keyboard?.off('keydown-SPACE');

    // GameSceneに結果を通知
    const gameScene = this.scene.get(this.returnSceneKey);
    if (gameScene) {
      gameScene.events.emit('quiz-completed', isCorrect);
    }

    this.scene.stop(); // クイズシーン終了
  }
}
