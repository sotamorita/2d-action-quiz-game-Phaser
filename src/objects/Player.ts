import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
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
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    properties: Record<string, any> = {}
  ) {
    super(scene, x, y, 'player');

    // プレイヤーをシーンに追加・物理演算を有効化
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // body に型アサーション（以降、すべての body 操作で安全）
    const body = this.body as Phaser.Physics.Arcade.Body;

    body.setGravityY(800);         // 重力を下方向にかける
    this.setBounce(0.1);           // 軽く跳ねる
    this.setCollideWorldBounds(true); // 画面端で止まる

    this.cursors = cursors;

    // Tiledプロパティ
    this.speed = properties.speed ?? 200;
    this.jumpForce = properties.jumpForce ?? 360;
    this.maxHealth = properties.maxHealth ?? 5;
    this.health = this.maxHealth;
  }

  startInvincibility(duration: number = 3000) {
    if (this.isInvincible) return;
    this.isInvincible = true;

    // 点滅エフェクト
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 100
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

  update() {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 横移動
    if (this.cursors.left?.isDown) {
      this.setVelocityX(-this.speed);
      this.anims.play('left', true);
    } else if (this.cursors.right?.isDown) {
      this.setVelocityX(this.speed);
      this.anims.play('right', true);
    } else if (body.blocked.down) {
      // 地上にいる時のみ速度を0にする（空中では慣性を保持）
      this.setVelocityX(0);
      this.anims.play('turn');
    }

    // ジャンプ（地面にいるときのみ）
    if (
      (this.cursors.up?.isDown || this.cursors.space?.isDown) &&
      body.blocked.down
    ) {
      this.setVelocityY(-this.jumpForce);
    }
  }

  heal(amount: number) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  damage(amount: number) {
    this.health = Math.max(this.health - amount, 0);
  }
}
