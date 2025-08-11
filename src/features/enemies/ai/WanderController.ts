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

    const isBlocked = enemy.body.blocked.left || enemy.body.blocked.right || enemy.body.blocked.up || enemy.body.blocked.down;
    const isOutOfBounds = this.isOutOfBounds(enemy);

    if (this.changeDirectionTimer <= 0 || isBlocked || isOutOfBounds) {
      this.setRandomVelocity(enemy);
      this.changeDirectionTimer = 5000;
    }

    if (isOutOfBounds) {
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
    return (
      enemy.x < this.bounds.left ||
      enemy.x > this.bounds.right ||
      enemy.y < this.bounds.top ||
      enemy.y > this.bounds.bottom
    );
  }

  private bringBackInBounds(enemy: Enemy): void {
    if (enemy.x < this.bounds.left) {
      enemy.x = this.bounds.left;
      enemy.body!.velocity.x *= -1;
    } else if (enemy.x > this.bounds.right) {
      enemy.x = this.bounds.right;
      enemy.body!.velocity.x *= -1;
    }

    if (enemy.y < this.bounds.top) {
      enemy.y = this.bounds.top;
      enemy.body!.velocity.y *= -1;
    } else if (enemy.y > this.bounds.bottom) {
      enemy.y = this.bounds.bottom;
      enemy.body!.velocity.y *= -1;
    }
  }
}
