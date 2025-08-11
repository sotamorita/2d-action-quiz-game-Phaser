import Enemy from '../Enemy';
import IAIController from './IAIController';

/**
 * 指定された軸に沿ってパトロールするAIコントローラー。
 */
export default class PatrolController implements IAIController {
  private initialPosition: number;
  private patrolRange: number;
  private direction: number;
  private axis: 'horizontal' | 'vertical';

  /**
   * @param initialPosition 敵の初期座標（XまたはY）
   * @param patrolRange パトロールする範囲（初期位置からの距離）
   * @param axis 移動軸 ('horizontal' または 'vertical')
   */
  constructor(initialPosition: number, patrolRange: number, axis: 'horizontal' | 'vertical' = 'horizontal') {
    this.initialPosition = initialPosition;
    this.patrolRange = patrolRange;
    this.axis = axis;
    this.direction = Math.random() < 0.5 ? -1 : 1;
  }

  public update(enemy: Enemy, delta: number): void {
    if (!enemy.body || !enemy.body.enable) {
      return;
    }

    if (this.axis === 'horizontal') {
      if (enemy.x <= this.initialPosition - this.patrolRange) {
        this.direction = 1;
      } else if (enemy.x >= this.initialPosition + this.patrolRange) {
        this.direction = -1;
      }
      enemy.setVelocityX(enemy.speed * this.direction);
    } else {
      if (enemy.y <= this.initialPosition - this.patrolRange) {
        this.direction = 1;
      } else if (enemy.y >= this.initialPosition + this.patrolRange) {
        this.direction = -1;
      }
      enemy.setVelocityY(enemy.speed * this.direction);
    }
  }
}
