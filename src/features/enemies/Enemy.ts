import BaseObject from '../../core/game-objects/BaseObject';
import { IAIController } from './ai';

// --- 定数定義 ---
// 敵の基本性能を定義します。ゲームバランスの調整はここで行います。
const ENEMY_SPEED = 50; // 敵の移動速度
const ENEMY_HEALTH = 3; // 敵のHP
const ENEMY_DAMAGE = 1; // 敵がプレイヤーに与えるダメージ量

/**
 * @class Enemy
 * @extends BaseObject
 * @description
 * 敵キャラクターの基本クラス。
 * 敵の基本的なステータス（HP、速度など）を保持し、
 * 実際の行動ロジックはAIControllerに委譲します。
 *
 * 設計思想:
 * ストラテジーパターンを採用しています。
 * `Enemy`クラス自体は「敵である」という基本的な枠組みだけを持ち、
 * 「どのように行動するか（徘徊する、追跡する、など）」という具体的な戦略(AI)は
 * `IAIController`を実装した別のクラスが担当します。
 * これにより、敵の見た目や基本性能と、その行動ロジックを分離でき、
 * 新しい種類のAIを持つ敵を簡単に追加できるようになります。
 */
export default class Enemy extends BaseObject {
  // --- プロパティ定義 ---
  readonly speed: number;
  health: number;
  readonly damage: number;
  private aiController?: IAIController; // この敵を制御するAIコントローラー

  /**
   * Enemyのインスタンスを生成します。
   * @param {Phaser.Scene} scene - このオブジェクトが所属するシーン。
   * @param {number} x - オブジェクトの初期X座標。
   * @param {number} y - オブジェクトの初期Y座標。
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 親クラス(BaseObject)のコンストラクタを呼び出し、基本的なセットアップを行います。
    super(scene, x, y, 'enemy');

    // 原点を左下に設定(0, 1)。地面とのめり込みを防ぎます。
    this.setOrigin(0, 1);
    // 他のオブジェクトに押されて動かないように設定
    this.setImmovable(true);
    // ワールドの境界線との衝突を有効に
    this.setCollideWorldBounds(true);

    // 基本性能をプロパティに適用
    this.speed = ENEMY_SPEED;
    this.health = ENEMY_HEALTH;
    this.damage = ENEMY_DAMAGE;
  }

  /**
   * 敵オブジェクトを初期化または再利用する際に呼び出されます。
   *
   * 設計思想:
   * オブジェクトプーリング（一度生成したオブジェクトを破棄せず、再利用する手法）を
   * 想定したメソッドです。敵が倒された後、新しい敵として再登場させる際に
   * このメソッドを呼ぶことで、新品同様の状態に戻すことができます。
   *
   * @param {IAIController} aiController - この敵を制御するAIコントローラー。
   */
  public initialize(aiController: IAIController): void {
    this.health = ENEMY_HEALTH; // HPをリセット
    this.aiController = aiController; // AIコントローラーを設定
    this.setActive(true); // アクティブ状態にする（updateが呼ばれるようになる）
    this.setVisible(true); // 表示状態にする
    if (this.body) {
      this.body.enable = true; // 物理ボディを有効にする
    }
  }

  /**
   * 毎フレーム呼び出される更新処理。
   * @param {number} time - ゲームの総経過時間。
   * @param {number} delta - 前のフレームからの経過時間。
   */
  update(time: number, delta: number): void {
    // 非アクティブ、または物理ボディがない場合は何もしない
    if (!this.active || !this.body) {
      return;
    }

    // 実際の行動は、設定されたAIコントローラーにすべて委任します。
    if (this.aiController) {
      this.aiController.update(this, delta);
    }
  }
}
