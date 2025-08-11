import BaseObject from './BaseObject';

// 定数
const PLAYER_GRAVITY = 950;
const PLAYER_BOUNCE = 0.1;
const INVINCIBILITY_DURATION = 3000;
const BLINK_DURATION = 100;

const ANIMATIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  TURN: 'turn'
};

// Tiledから渡されるプロパティの型定義
export interface PlayerConfig {
  speed: number;
  jumpForce: number;
  maxHealth: number;
}

export default class Player extends BaseObject {
  speed: number;
  jumpForce: number;
  maxHealth: number;
  health: number;

  isInvincible: boolean = false;
  private invincibleTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: PlayerConfig
  ) {
    super(scene, x, y, 'player');

    // body に型アサーション（以降、すべての body 操作で安全）
    const body = this.body as Phaser.Physics.Arcade.Body;

    body.setGravityY(PLAYER_GRAVITY);
    this.setBounce(PLAYER_BOUNCE);
    this.setCollideWorldBounds(true);

    // Tiledから読み込んだ設定を適用
    this.speed = config.speed;
    this.jumpForce = config.jumpForce;
    this.maxHealth = config.maxHealth;
    this.health = this.maxHealth;
  }

  public initialize(): void {
    this.anims.play(ANIMATIONS.TURN);
  }

  startInvincibility(duration: number = INVINCIBILITY_DURATION) {
    if (this.isInvincible) return;
    this.isInvincible = true;

    // 点滅エフェクト
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: BLINK_DURATION
    });

    // タイマーで無敵解除
    this.invincibleTimer = this.scene.time.addEvent({
      delay: duration,
      callback: () => {
        this.isInvincible = false;
        this.setAlpha(1);
        this.scene.tweens.killTweensOf(this);
      }
    });
  }

  update(leftIsDown: boolean, rightIsDown: boolean, jumpIsDown: boolean) {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 横移動
    if (leftIsDown) {
      this.setVelocityX(-this.speed);
      this.anims.play(ANIMATIONS.LEFT, true);
    } else if (rightIsDown) {
      this.setVelocityX(this.speed);
      this.anims.play(ANIMATIONS.RIGHT, true);
    } else if (body.blocked.down) {
      // 地上にいる時のみ速度を0にする（空中では慣性を保持）
      this.setVelocityX(0);
      this.anims.play(ANIMATIONS.TURN);
    }

    // ジャンプ（地面にいるときのみ）
    if (jumpIsDown && body.blocked.down) {
      this.setVelocityY(-this.jumpForce);
    }
  }

  heal(amount: number) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  damage(amount: number) {
    this.health = Math.max(this.health - amount, 0);
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
