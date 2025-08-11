import Enemy from '../Enemy';
import IAIController from './IAIController';

/**
 * 指定された境界内を徘徊するAIコントローラー。
 * 5秒ごと、または地形や境界に衝突した場合に方向転換します。
 */
export default class WanderController implements IAIController {
  private bounds: Phaser.Geom.Rectangle;
  private changeDirectionTimer: number;

  /**
   * @param bounds 敵が移動できる境界矩形
   * @param enemy 対象の敵オブジェクト
   */
  constructor(bounds: Phaser.Geom.Rectangle, enemy: Enemy) {
    this.bounds = bounds;
    this.changeDirectionTimer = 0;
    this.setRandomVelocity(enemy);
  }

  public update(enemy: Enemy, delta: number): void {
    if (!enemy.body || !enemy.body.enable) {
      return;
    }

    this.changeDirectionTimer -= delta;

    // 時間経過でのみ、ランダムな方向転換を行う
    if (this.changeDirectionTimer <= 0) {
      this.setRandomVelocity(enemy);
      this.changeDirectionTimer = 5000;
    }

    // 境界外に出た、または壁に衝突した場合の反射処理
    const isBlocked = enemy.body.blocked.left || enemy.body.blocked.right || enemy.body.blocked.up || enemy.body.blocked.down;
    if (this.isOutOfBounds(enemy) || isBlocked) {
      this.bringBackInBounds(enemy);
    }
  }

  private setRandomVelocity(enemy: Enemy): void {
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    const velocity = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
    velocity.scale(enemy.speed);
    enemy.setVelocity(velocity.x, velocity.y);
  }

  private isOutOfBounds(enemy: Enemy): boolean {
    const bounds = enemy.getBounds();
    return (
      bounds.left < this.bounds.left ||
      bounds.right > this.bounds.right ||
      bounds.top < this.bounds.top ||
      bounds.bottom > this.bounds.bottom
    );
  }

  private bringBackInBounds(enemy: Enemy): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const spriteBounds = enemy.getBounds();

    // X軸の反射
    if (spriteBounds.left < this.bounds.left) {
      body.x = this.bounds.left;
      body.velocity.x = Math.abs(body.velocity.x); // 必ず正の方向（右）へ
    } else if (spriteBounds.right > this.bounds.right) {
      body.x = this.bounds.right - spriteBounds.width;
      body.velocity.x = -Math.abs(body.velocity.x); // 必ず負の方向（左）へ
    } else if (body.blocked.left) {
      body.velocity.x = Math.abs(body.velocity.x);
    } else if (body.blocked.right) {
      body.velocity.x = -Math.abs(body.velocity.x);
    }

    // Y軸の反射
    if (spriteBounds.top < this.bounds.top) {
      body.y = this.bounds.top;
      body.velocity.y = Math.abs(body.velocity.y); // 必ず正の方向（下）へ
    } else if (spriteBounds.bottom > this.bounds.bottom) {
      body.y = this.bounds.bottom - spriteBounds.height;
      body.velocity.y = -Math.abs(body.velocity.y); // 必ず負の方向（上）へ
    } else if (body.blocked.up) {
      body.velocity.y = Math.abs(body.velocity.y);
    } else if (body.blocked.down) {
      body.velocity.y = -Math.abs(body.velocity.y);
    }
  }
}
