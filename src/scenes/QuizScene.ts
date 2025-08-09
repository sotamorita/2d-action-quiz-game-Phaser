import Phaser from 'phaser';

export default class QuizScene extends Phaser.Scene {
  private selectedIndex = 0;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private choices = ['1', '2', '3', '4'];
  private correctAnswer = '4';
  private enemy!: Phaser.GameObjects.GameObject;
  private returnSceneKey!: string;

  // 入力ハンドラ参照＆二重決定防止
  private inputLocked = false;
  private onUp!: () => void;
  private onDown!: () => void;
  private onEnter!: () => void;
  private onSpace!: () => void;

  constructor() {
    super({ key: 'QuizScene' });
  }

  create(data: { enemy: Phaser.GameObjects.GameObject; returnSceneKey: string }) {
    this.enemy = data.enemy;
    this.returnSceneKey = data.returnSceneKey;

    // 状態リセット
    this.selectedIndex = 0;
    this.choiceTexts = [];
    this.inputLocked = false;

    // キーボード有効化（非nullアサーション）
    this.input.keyboard!.enabled = true;

    // 背景
    this.add.rectangle(320, 200, 640, 400, 0x000000, 0.6);

    // 質問（仮）
    this.add.text(320, 120, '2 + 2 = ?', {
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 選択肢
    this.choices.forEach((choice, i) => {
      const text = this.add.text(320, 160 + i * 35, choice, {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 15, y: 8 }
      }).setOrigin(0.5);
      this.choiceTexts.push(text);
    });
    this.updateSelection();

    // --- 入力ハンドラをプロパティに束縛して登録 ---
    this.onUp = () => {
      if (this.inputLocked) return;
      this.selectedIndex = (this.selectedIndex + this.choices.length - 1) % this.choices.length;
      this.updateSelection();
    };
    this.onDown = () => {
      if (this.inputLocked) return;
      this.selectedIndex = (this.selectedIndex + 1) % this.choices.length;
      this.updateSelection();
    };
    this.onEnter = () => this.confirmAnswer();
    this.onSpace = () => this.confirmAnswer();

    this.input.keyboard!.on('keydown-UP', this.onUp, this);
    this.input.keyboard!.on('keydown-DOWN', this.onDown, this);
    this.input.keyboard!.on('keydown-ENTER', this.onEnter, this);
    this.input.keyboard!.on('keydown-SPACE', this.onSpace, this);
  }

  updateSelection() {
    this.choiceTexts.forEach((text, i) => {
      if (!text.scene || !text.active) return;
      if (i === this.selectedIndex) {
        text.setStyle({ backgroundColor: '#ffff00', color: '#000000' }); // 選択中
      } else {
        text.setStyle({ backgroundColor: 'rgba(0,0,0,0)', color: '#ffffff' }); // 非選択
      }
    });
  }

  confirmAnswer() {
    if (this.inputLocked) return;   // 二重決定防止
    this.inputLocked = true;

    const selected = this.choices[this.selectedIndex];
    const isCorrect = selected === this.correctAnswer;

    // --- ここで確実にリスナー解除 ---
    const kb = this.input.keyboard!;
    kb.off('keydown-UP', this.onUp, this);
    kb.off('keydown-DOWN', this.onDown, this);
    kb.off('keydown-ENTER', this.onEnter, this);
    kb.off('keydown-SPACE', this.onSpace, this);

    // GameSceneに結果を通知（イベント名一致）
    const gameScene = this.scene.get(this.returnSceneKey);
    if (gameScene) {
      gameScene.events.emit('quiz-completed', isCorrect);
    }

    // このシーンを閉じる（GameScene側のlistenerで resume/破壊などを実施）
    this.scene.stop();
  }
}
