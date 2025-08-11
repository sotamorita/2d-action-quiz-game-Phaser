import Enemy from '../Enemy';
import IAIController from './IAIController';

/**
 * @class WanderController
 * @implements IAIController
 * @description
 * 敵キャラクターに「徘徊」行動を実装するためのAIコントローラー。
 * 指定された境界（bounds）内をランダムに動き回ります。
 *
 * 設計思想:
 * このクラスは、`Enemy`クラスから行動ロジックを分離するストラテジーパターンの一例です。
 * 敵の行動アルゴリズムをカプセル化することで、他のAI（例: 追跡AI）との交換や、
 * 新しいAIの追加が容易になります。
 *
 * 行動ロジック:
 * 1. 5秒ごとにランダムな方向へ向きを変えるタイマーベースの方向転換。
 * 2. 移動範囲の境界や、他の物理オブジェクト（壁など）に衝突した際の物理ベースの方向転換（反射）。
 * この2つを組み合わせることで、より自然で予測しにくい動きを実現しています。
 */
export default class WanderController implements IAIController {
  private bounds: Phaser.Geom.Rectangle; // 敵が移動できる境界矩形
  private changeDirectionTimer: number; // 次の方向転換までの残り時間（ミリ秒）

  /**
   * WanderControllerのインスタンスを生成します。
   * @param {Phaser.Geom.Rectangle} bounds - 敵が移動できる境界矩形。
   * @param {Enemy} enemy - このAIが制御する敵オブジェクト。
   */
  constructor(bounds: Phaser.Geom.Rectangle, enemy: Enemy) {
    this.bounds = bounds;
    this.changeDirectionTimer = 0; // すぐに最初の方向転換が行われるように0に設定
    this.setRandomVelocity(enemy); // 初期速度をランダムに設定
  }

  /**
   * 毎フレーム呼び出される更新処理。敵の行動を制御します。
   * @param {Enemy} enemy - 制御対象の敵オブジェクト。
   * @param {number} delta - 前のフレームからの経過時間（ミリ秒）。
   */
  public update(enemy: Enemy, delta: number): void {
    // 敵が無効化されている場合は何もしない
    if (!enemy.body || !enemy.body.enable) {
      return;
    }

    this.changeDirectionTimer -= delta;

    // 時間経過による方向転換
    if (this.changeDirectionTimer <= 0) {
      this.setRandomVelocity(enemy);
      this.changeDirectionTimer = 5000; // 次の方向転換を5秒後に設定
    }

    // 物理的な衝突による方向転換
    const isBlocked = enemy.body.blocked.left || enemy.body.blocked.right || enemy.body.blocked.up || enemy.body.blocked.down;
    if (this.isOutOfBounds(enemy) || isBlocked) {
      this.bringBackInBounds(enemy);
    }
  }

  /**
   * 敵にランダムな方向の速度を設定します。
   * @param {Enemy} enemy - 速度を設定する敵オブジェクト。
   */
  private setRandomVelocity(enemy: Enemy): void {
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI); // 0から360度までのランダムな角度
    const velocity = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)); // 角度から速度ベクトルを計算
    velocity.scale(enemy.speed); // 敵の基本速度を適用
    enemy.setVelocity(velocity.x, velocity.y);
  }

  /**
   * 敵が指定された境界の外に出たかどうかを判定します。
   * @param {Enemy} enemy - 判定対象の敵オブジェクト。
   * @returns {boolean} 境界外に出た場合はtrue。
   */
  private isOutOfBounds(enemy: Enemy): boolean {
    const bounds = enemy.getBounds(); // スプライト全体のバウンディングボックスを取得
    return (
      bounds.left < this.bounds.left ||
      bounds.right > this.bounds.right ||
      bounds.top < this.bounds.top ||
      bounds.bottom > this.bounds.bottom
    );
  }

  /**
   * 境界や壁に衝突した敵を、境界内に戻し、速度を反転させます。
   * @param {Enemy} enemy - 処理対象の敵オブジェクト。
   */
  private bringBackInBounds(enemy: Enemy): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const spriteBounds = enemy.getBounds();

    // X軸方向の反射処理
    if (spriteBounds.left < this.bounds.left) {
      // 左境界の外に出た場合
      body.x = this.bounds.left; // 境界の内側に戻す
      body.velocity.x = Math.abs(body.velocity.x); // 速度を右向きに反転
    } else if (spriteBounds.right > this.bounds.right) {
      // 右境界の外に出た場合
      body.x = this.bounds.right - spriteBounds.width; // 境界の内側に戻す
      body.velocity.x = -Math.abs(body.velocity.x); // 速度を左向きに反転
    } else if (body.blocked.left) {
      // 左側の壁に衝突した場合
      body.velocity.x = Math.abs(body.velocity.x); // 速度を右向きに反転
    } else if (body.blocked.right) {
      // 右側の壁に衝突した場合
      body.velocity.x = -Math.abs(body.velocity.x); // 速度を左向きに反転
    }

    // Y軸方向の反射処理
    if (spriteBounds.top < this.bounds.top) {
      // 上境界の外に出た場合
      body.y = this.bounds.top;
      body.velocity.y = Math.abs(body.velocity.y); // 速度を下向きに反転
    } else if (spriteBounds.bottom > this.bounds.bottom) {
      // 下境界の外に出た場合
      body.y = this.bounds.bottom - spriteBounds.height;
      body.velocity.y = -Math.abs(body.velocity.y); // 速度を上向きに反転
    } else if (body.blocked.up) {
      // 上側の壁に衝突した場合
      body.velocity.y = Math.abs(body.velocity.y); // 速度を下向きに反転
    } else if (body.blocked.down) {
      // 下側の壁に衝突した場合
      body.velocity.y = -Math.abs(body.velocity.y); // 速度を上向きに反転
    }
  }
}
