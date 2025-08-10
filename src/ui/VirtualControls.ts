import Phaser from 'phaser';

interface VirtualControlKey {
  isDown: boolean;
  justDown: boolean;
  justUp: boolean;
}

export default class VirtualControls extends Phaser.GameObjects.Container {
  private leftButton!: Phaser.GameObjects.Graphics;
  private rightButton!: Phaser.GameObjects.Graphics;
  private jumpButton!: Phaser.GameObjects.Graphics;
  private pauseButton!: Phaser.GameObjects.Graphics;

  private pointerStates: Map<number, { left: boolean; right: boolean; jump: boolean; pause: boolean }> = new Map();

  public left: VirtualControlKey = { isDown: false, justDown: false, justUp: false };
  public right: VirtualControlKey = { isDown: false, justDown: false, justUp: false };
  public jump: VirtualControlKey = { isDown: false, justDown: false, justUp: false };
  public pause: VirtualControlKey = { isDown: false, justDown: false, justUp: false };

  private buttonConfigs = [
    { name: 'left', x: 80, y: 480, radius: 40, text: '←' },
    { name: 'right', x: 180, y: 480, radius: 40, text: '→' },
    { name: 'jump', x: 720, y: 480, radius: 40, text: '↑' },
    { name: 'pause', x: 720, y: 80, radius: 30, text: '||' }
  ];

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.setScrollFactor(0); // カメラに追従しない

    this.createButtons();
    this.setupInputHandlers();
    this.setupResizeHandler();

    // 初期配置
    this.repositionButtons();

    // シーンのシャットダウン時にクリーンアップ (destroyメソッドで処理するため削除)
  }

  private createButtons(): void {
    this.buttonConfigs.forEach(config => {
      const button = this.scene.add.graphics();
      button.setDepth(100); // UIが他のゲームオブジェクトの上に表示されるようにする
      this.add(button); // コンテナに追加

      // ボタンの参照をプロパティに設定
      switch (config.name) {
        case 'left':
          this.leftButton = button;
          break;
        case 'right':
          this.rightButton = button;
          break;
        case 'jump':
          this.jumpButton = button;
          break;
        case 'pause':
          this.pauseButton = button;
          break;
      }

      this.drawButton(button, config.radius, 0x000000, 0.4); // 初期は半透明
      this.drawButtonText(button, config.text, config.radius);
    });
  }

  private drawButton(button: Phaser.GameObjects.Graphics, radius: number, color: number, alpha: number): void {
    button.clear();
    button.fillStyle(color, alpha);
    button.fillCircle(0, 0, radius);
    button.lineStyle(2, 0xffffff, 0.8); // 白い枠線
    button.strokeCircle(0, 0, radius);
  }

  private drawButtonText(button: Phaser.GameObjects.Graphics, text: string, radius: number): void {
    const textObj = this.scene.add.text(0, 0, text, {
      fontSize: `${radius * 0.8}px`,
      fontFamily: 'DotGothic16, sans-serif',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    button.setData('textObj', textObj); // テキストオブジェクトをGraphicsに紐付け
    this.add(textObj); // VirtualControlsコンテナに追加
    textObj.setPosition(button.x, button.y); // ボタンの中心に配置
  }

  private setupInputHandlers(): void {
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this); // マルチタッチ対応のためmoveも監視
  }

  private setupResizeHandler(): void {
    this.scene.scale.on('resize', this.repositionButtons, this);
  }

  private repositionButtons(): void {
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;

    // 安全域の余白 (例: 16px/24px)
    const safeAreaPaddingX = 24;
    const safeAreaPaddingY = 24;

    // 左側のボタン
    this.leftButton.setPosition(safeAreaPaddingX + this.buttonConfigs[0].radius, gameHeight - safeAreaPaddingY - this.buttonConfigs[0].radius);
    this.rightButton.setPosition(safeAreaPaddingX + this.buttonConfigs[1].radius + 100, gameHeight - safeAreaPaddingY - this.buttonConfigs[1].radius);

    // 右側のボタン
    this.jumpButton.setPosition(gameWidth - safeAreaPaddingX - this.buttonConfigs[2].radius, gameHeight - safeAreaPaddingY - this.buttonConfigs[2].radius);

    // ポーズボタン (右上)
    this.pauseButton.setPosition(gameWidth - safeAreaPaddingX - this.buttonConfigs[3].radius, safeAreaPaddingY + this.buttonConfigs[3].radius);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.pointerStates.set(pointer.id, { left: false, right: false, jump: false, pause: false });
    this.checkButtonPress(pointer, true);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    this.checkButtonPress(pointer, false);
    this.pointerStates.delete(pointer.id); // ポインターの状態をクリア
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // ポインターが移動してもボタンの押下状態を更新
    if (pointer.isDown) {
      this.checkButtonPress(pointer, true);
    }
  }

  private checkButtonPress(pointer: Phaser.Input.Pointer, isDown: boolean): void {
    const currentState = this.pointerStates.get(pointer.id) || { left: false, right: false, jump: false, pause: false };

    let buttonPressed = false;

    // 各ボタンの当たり判定
    if (this.isPointInCircle(pointer, this.leftButton, this.buttonConfigs[0].radius)) {
      currentState.left = isDown;
      buttonPressed = true;
      this.drawButton(this.leftButton, this.buttonConfigs[0].radius, 0x000000, isDown ? 0.8 : 0.4);
      this.vibrate();
    } else {
      currentState.left = false;
      this.drawButton(this.leftButton, this.buttonConfigs[0].radius, 0x000000, 0.4);
    }

    if (this.isPointInCircle(pointer, this.rightButton, this.buttonConfigs[1].radius)) {
      currentState.right = isDown;
      buttonPressed = true;
      this.drawButton(this.rightButton, this.buttonConfigs[1].radius, 0x000000, isDown ? 0.8 : 0.4);
      this.vibrate();
    } else {
      currentState.right = false;
      this.drawButton(this.rightButton, this.buttonConfigs[1].radius, 0x000000, 0.4);
    }

    if (this.isPointInCircle(pointer, this.jumpButton, this.buttonConfigs[2].radius)) {
      currentState.jump = isDown;
      buttonPressed = true;
      this.drawButton(this.jumpButton, this.buttonConfigs[2].radius, 0x000000, isDown ? 0.8 : 0.4);
      this.vibrate();
    } else {
      currentState.jump = false;
      this.drawButton(this.jumpButton, this.buttonConfigs[2].radius, 0x000000, 0.4);
    }

    if (this.isPointInCircle(pointer, this.pauseButton, this.buttonConfigs[3].radius)) {
      currentState.pause = isDown;
      buttonPressed = true;
      this.drawButton(this.pauseButton, this.buttonConfigs[3].radius, 0x000000, isDown ? 0.8 : 0.4);
      this.vibrate();
      if (isDown) { // 押下時のみイベントを発火
        this.scene.events.emit('virtual-pause-button-down');
      }
    } else {
      currentState.pause = false;
      this.drawButton(this.pauseButton, this.buttonConfigs[3].radius, 0x000000, 0.4);
    }

    this.pointerStates.set(pointer.id, currentState);
    this.updateOverallControlState();
  }

  private isPointInCircle(pointer: Phaser.Input.Pointer, button: Phaser.GameObjects.Graphics, radius: number): boolean {
    const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, button.x, button.y);
    return distance <= radius;
  }

  private updateOverallControlState(): void {
    const oldLeftIsDown = this.left.isDown;
    const oldRightIsDown = this.right.isDown;
    const oldJumpIsDown = this.jump.isDown;
    const oldPauseIsDown = this.pause.isDown;

    this.left.isDown = false;
    this.right.isDown = false;
    this.jump.isDown = false;
    this.pause.isDown = false;

    this.pointerStates.forEach(state => {
      if (state.left) this.left.isDown = true;
      if (state.right) this.right.isDown = true;
      if (state.jump) this.jump.isDown = true;
      if (state.pause) this.pause.isDown = true;
    });

    // justDown / justUp の更新
    this.left.justDown = this.left.isDown && !oldLeftIsDown;
    this.left.justUp = !this.left.isDown && oldLeftIsDown;

    this.right.justDown = this.right.isDown && !oldRightIsDown;
    this.right.justUp = !this.right.isDown && oldRightIsDown;

    this.jump.justDown = this.jump.isDown && !oldJumpIsDown;
    this.jump.justUp = !this.jump.isDown && oldJumpIsDown;

    this.pause.justDown = this.pause.isDown && !oldPauseIsDown;
    this.pause.justUp = !this.pause.isDown && oldPauseIsDown;
  }

  private vibrate(): void {
    if (navigator.vibrate) {
      navigator.vibrate(10); // 10ms 振動
    }
  }

  // コンテナが破棄される際に呼び出される
  destroy(fromScene?: boolean): void {
    this.cleanup();
    super.destroy(fromScene);
  }

  private cleanup(): void {
    // シーンがまだ有効な場合のみイベントリスナーを解除
    // this.sceneがnullになる可能性を考慮し、より安全なチェックを行う
    if (this.scene) {
      if (this.scene.input) {
        this.scene.input.off('pointerdown', this.handlePointerDown, this);
        this.scene.input.off('pointerup', this.handlePointerUp, this);
        this.scene.input.off('pointermove', this.handlePointerMove, this);
      }
      if (this.scene.scale) {
        this.scene.scale.off('resize', this.repositionButtons, this);
      }
    }
    this.pointerStates.clear();
  }
}
