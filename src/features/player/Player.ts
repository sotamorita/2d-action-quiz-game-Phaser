import BaseObject from '../../core/game-objects/BaseObject';

// 状態管理
export enum PlayerState {
  NORMAL,
  INVINCIBLE,
  DEAD
}

// 定数
const PLAYER_GRAVITY = 950;
const PLAYER_BOUNCE = 0.1;
const INVINCIBILITY_DURATION = 3000;
const BLINK_DURATION = 100;

// プレイヤーの基本性能をコードで定義
const PLAYER_SPEED = 200;
const PLAYER_JUMP_FORCE = 360;
const PLAYER_MAX_HEALTH = 1;

const ANIMATIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  TURN: 'turn'
};

export default class Player extends BaseObject {
  readonly speed: number;
  readonly jumpForce: number;
  readonly maxHealth: number;
  health: number;

  public state = PlayerState.NORMAL;
  private invincibleTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number
  ) {
    super(scene, x, y, 'player');

    // body に型アサーション（以降、すべての body 操作で安全）
    const body = this.body as Phaser.Physics.Arcade.Body;

    body.setGravityY(PLAYER_GRAVITY);
    this.setBounce(PLAYER_BOUNCE);
    this.setCollideWorldBounds(true);

    // 基本性能を適用
    this.speed = PLAYER_SPEED;
    this.jumpForce = PLAYER_JUMP_FORCE;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.health = this.maxHealth;
  }

  public initialize(): void {
    this.anims.play(ANIMATIONS.TURN, true);
    this.state = PlayerState.NORMAL;
  }

  public transitionToState(newState: PlayerState, data?: any): void {
    if (this.state === newState) return;

    // 前の状態からのクリーンアップ
    switch (this.state) {
      case PlayerState.INVINCIBLE:
        this.invincibleTimer?.destroy();
        this.scene.tweens.killTweensOf(this);
        this.setAlpha(1);
        break;
    }

    const oldState = this.state;
    this.state = newState;

    // 新しい状態への初期化
    switch (this.state) {
      case PlayerState.NORMAL:
        break;

      case PlayerState.INVINCIBLE:
        this.scene.tweens.add({
          targets: this,
          alpha: 0.3,
          yoyo: true,
          repeat: -1,
          duration: BLINK_DURATION
        });
        this.invincibleTimer = this.scene.time.addEvent({
          delay: data?.duration || INVINCIBILITY_DURATION,
          callback: () => this.transitionToState(PlayerState.NORMAL)
        });
        break;

      case PlayerState.DEAD:
        if (!this.body) return;
        this.setCollideWorldBounds(false);
        (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
        (this.body as Phaser.Physics.Arcade.Body).checkCollision.down = false;
        this.setVelocity(0, -300);
        this.scene.tweens.add({
          targets: this,
          angle: 360,
          alpha: 0,
          duration: 1500,
          onComplete: () => this.emit('death-animation-complete')
        });
        break;
    }

    this.emit('state-changed', this.state, oldState);
  }

  update(leftIsDown: boolean, rightIsDown: boolean, jumpIsDown: boolean) {
    if (this.state === PlayerState.DEAD) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // 横移動
    if (leftIsDown) {
      this.setVelocityX(-this.speed);
      this.anims.play(ANIMATIONS.LEFT, true);
    } else if (rightIsDown) {
      this.setVelocityX(this.speed);
      this.anims.play(ANIMATIONS.RIGHT, true);
    } else {
      // 地上にいる時のみ停止
      if (onGround) {
        this.setVelocityX(0);
      }
      this.anims.play(ANIMATIONS.TURN);
    }

    // ジャンプ（地面にいるときのみ）
    if (jumpIsDown && onGround) {
      this.setVelocityY(-this.jumpForce);
    }
  }

  heal(amount: number) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  damage(amount: number) {
    if (this.state === PlayerState.DEAD || this.state === PlayerState.INVINCIBLE) return;

    this.health = Math.max(this.health - amount, 0);
    if (this.health === 0) {
      this.transitionToState(PlayerState.DEAD);
    }
  }

  destroy(fromScene?: boolean) {
    // 無敵状態のタイマーとTweenをクリーンアップ
    if (this.invincibleTimer) {
      this.invincibleTimer.destroy();
      this.invincibleTimer = undefined;
    }
    if (this.scene) {
      this.scene.tweens.killTweensOf(this);
    }

    super.destroy(fromScene);
  }
}
