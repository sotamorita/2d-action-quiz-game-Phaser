import BaseObject from '../../core/game-objects/BaseObject';

/**
 * @enum {PlayerState}
 * @description プレイヤーの状態を管理するための列挙型。
 * 状態に応じてプレイヤーの挙動や見た目が変化します。
 * - NORMAL: 通常状態。操作可能。
 * - INVINCIBLE: ダメージを受けない無敵状態。点滅エフェクトがかかる。
 * - DEAD: 死亡状態。操作不能になり、死亡アニメーションが再生される。
 */
export enum PlayerState {
  NORMAL,
  INVINCIBLE,
  DEAD
}

// --- 定数定義 ---
// これらの定数は、ゲームバランスの調整を容易にするために一箇所にまとめられています。
// 後から「プレイヤーのジャンプ力を少し上げたい」といった変更がしやすくなります。

// 物理関連
const PLAYER_GRAVITY = 950; // プレイヤーにかかる重力
const PLAYER_BOUNCE = 0.1; // 地面や壁に衝突した際の反発係数
const INVINCIBILITY_DURATION = 3000; // 無敵状態の継続時間（ミリ秒）
const BLINK_DURATION = 100; // 無敵状態の際の点滅間隔（ミリ秒）

// プレイヤーの基本性能
const PLAYER_SPEED = 220; // 水平方向の移動速度
const PLAYER_JUMP_FORCE = 360; // ジャンプの強さ
const PLAYER_MAX_HEALTH = 2; // 最大HP
const PLAYER_INITIAL_HEALTH = 1; // 初期HP
const PLAYER_DRAG = 2000; // 地上での摩擦係数。値が大きいほど早く止まる。

// アニメーションキー
const ANIMATIONS = {
  LEFT: 'left', // 左向き
  RIGHT: 'right', // 右向き
  TURN: 'turn' // 正面向き（静止時）
};

/**
 * @class Player
 * @extends BaseObject
 * @description
 * プレイヤーキャラクターを制御するクラス。
 * ユーザーの入力に応じた移動、ジャンプ、状態変化（通常、無敵、死亡）、
 * アニメーションの管理など、プレイヤーに関するすべてのロジックを担います。
 */
export default class Player extends BaseObject {
  // --- プロパティ定義 ---
  readonly speed: number;
  readonly jumpForce: number;
  readonly maxHealth: number;
  health: number;

  public state = PlayerState.NORMAL; // 現在の状態
  private invincibleTimer?: Phaser.Time.TimerEvent; // 無敵時間タイマー
  private lastDirection: 'left' | 'right' | 'turn' = 'turn'; // 最後に向いていた方向

  /**
   * Playerのインスタンスを生成します。
   * @param {Phaser.Scene} scene - このオブジェクトが所属するシーン。
   * @param {number} x - オブジェクトの初期X座標。
   * @param {number} y - オブジェクトの初期Y座標。
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number
  ) {
    // 親クラス(BaseObject)のコンストラクタを呼び出し、基本的なセットアップを行います。
    super(scene, x, y, 'player');

    // 原点を左下に設定(0, 1)。これにより、地面とのめり込みを防ぎ、座標計算が直感的に。
    this.setOrigin(0, 1);

    // 物理ボディを取得。型アサーションで以降`body`がnullでないことを保証し、安全に操作できます。
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 物理設定
    body.setGravityY(PLAYER_GRAVITY); // 重力を適用
    this.setBounce(PLAYER_BOUNCE); // 反発係数を設定
    this.setCollideWorldBounds(true); // ワールドの境界線との衝突を有効に
    if (this.body) {
      // 地上でのみ働く摩擦を設定
      (this.body as Phaser.Physics.Arcade.Body).setDragX(PLAYER_DRAG);
    }

    // 基本性能をプロパティに適用
    this.speed = PLAYER_SPEED;
    this.jumpForce = PLAYER_JUMP_FORCE;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.health = PLAYER_INITIAL_HEALTH;
  }

  /**
   * プレイヤーの状態を初期化します。
   * ゲーム開始時やリトライ時に呼び出され、プレイヤーを最初の状態に戻します。
   */
  public initialize(): void {
    this.anims.play(ANIMATIONS.TURN, true); // 正面向きアニメーションで開始
    this.state = PlayerState.NORMAL; // 状態を通常に
    this.setVelocity(0, 0); // 速度をリセット
    this.lastDirection = 'turn'; // 向きをリセット
  }

  /**
   * プレイヤーの状態を遷移させます。
   * @param {PlayerState} newState - 遷移先の新しい状態。
   * @param {any} [data] - 状態遷移に伴う追加データ（例: 無敵時間）。
   *
   * 設計思想:
   * 状態遷移のロジックを一元管理することで、コードの見通しを良くし、
   * 状態の追加や変更を容易にしています（ステートパターン）。
   * 各状態への遷移時に、前の状態のクリーンアップと新しい状態の初期化を確実に行います。
   */
  public transitionToState(newState: PlayerState, data?: any): void {
    if (this.state === newState) return; // 同じ状態への遷移は無視

    // 1. 前の状態からのクリーンアップ処理
    switch (this.state) {
      case PlayerState.INVINCIBLE:
        // 無敵状態を終了する際に、タイマーや点滅エフェクトを停止・破棄します。
        this.invincibleTimer?.destroy();
        this.scene.tweens.killTweensOf(this);
        this.setAlpha(1); // 透明度を元に戻す
        break;
    }

    const oldState = this.state;
    this.state = newState;

    // 2. 新しい状態への初期化処理
    switch (this.state) {
      case PlayerState.NORMAL:
        // 通常状態への遷移では特別な初期化は不要
        break;

      case PlayerState.INVINCIBLE:
        // 無敵状態になったら、点滅エフェクトを開始します。
        this.scene.tweens.add({
          targets: this,
          alpha: 0.3,
          yoyo: true, // trueにすると元の値に自動で戻る（点滅）
          repeat: -1, // 無限に繰り返す
          duration: BLINK_DURATION
        });
        // 指定時間後に通常状態に戻るタイマーをセットします。
        this.invincibleTimer = this.scene.time.addEvent({
          delay: data?.duration || INVINCIBILITY_DURATION,
          callback: () => this.transitionToState(PlayerState.NORMAL)
        });
        break;

      case PlayerState.DEAD:
        if (!this.body) return;
        // 死亡アニメーションの準備
        this.setCollideWorldBounds(false); // 画面外に出られるように
        (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(true); // 重力は有効のまま
        (this.body as Phaser.Physics.Arcade.Body).checkCollision.down = false; // 地面との衝突を無効に
        // 進行方向に応じて飛び上がる向きを変える
        const directionX = this.lastDirection === 'left' ? -1 : 1;
        this.setVelocity(100 * directionX, -300); // 斜め上に飛び上がる
        // 回転しながら消えるアニメーション
        this.scene.tweens.add({
          targets: this,
          angle: 360,
          alpha: 0,
          duration: 1500,
          onComplete: () => this.emit('death-animation-complete') // アニメーション完了を通知
        });
        break;
    }

    // 状態が変化したことを他のオブジェクトに通知します。
    this.emit('state-changed', this.state, oldState);
  }

  /**
   * 毎フレーム呼び出される更新処理。
   * ユーザーの入力に基づいてプレイヤーの物理的な動きを制御します。
   * @param {boolean} leftIsDown - 左キーが押されているか。
   * @param {boolean} rightIsDown - 右キーが押されているか。
   * @param {boolean} jumpIsDown - ジャンプキーが押されているか。
   */
  update(leftIsDown: boolean, rightIsDown: boolean, jumpIsDown: boolean) {
    if (this.state === PlayerState.DEAD) return; // 死亡中は操作を受け付けない

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down; // 地面に接しているか

    // --- 1. 物理挙動と向きの状態管理 ---
    if (leftIsDown) {
      this.setVelocityX(-this.speed); // 左に移動
      this.lastDirection = 'left'; // 向きを記録
    } else if (rightIsDown) {
      this.setVelocityX(this.speed); // 右に移動
      this.lastDirection = 'right'; // 向きを記録
    }

    if (onGround) {
      // 地上にいるときの処理
      body.setDragX(PLAYER_DRAG); // 強い摩擦をかけて、キーを離すとすぐ止まるように
      // 地上で左右キーが押されておらず、速度が十分落ちたら正面向きにする
      if (!leftIsDown && !rightIsDown) {
        if (Math.abs(body.velocity.x) <= 10) {
          this.lastDirection = 'turn';
        }
      }
      if (jumpIsDown) {
        this.setVelocityY(-this.jumpForce); // ジャンプ
      }
    } else {
      // 空中にいるときの処理
      body.setDragX(0); // 空中では摩擦をなくし、左右にある程度動けるように
    }

    // --- 2. アニメーションの制御 ---
    // 物理挙動とは分離して、現在の状態に基づいてアニメーションを決定・再生します。
    this.updateAnimation();
  }

  /**
   * アニメーションを更新します。
   * 現在のプレイヤーの状態（向き、接地状態）に応じて、適切なアニメーションを再生します。
   */
  private updateAnimation(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    let newAnimKey = this.anims.currentAnim?.key; // 現在再生中のアニメーションキー

    if (onGround) {
      // 地上にいる場合
      if (this.lastDirection !== 'turn') {
        newAnimKey = this.lastDirection; // 左右キーが押されていればその向きのアニメーション
      } else {
        newAnimKey = ANIMATIONS.TURN; // 停止していれば正面向き
      }
    } else {
      // 空中にいる場合
      // ジャンプ中も左右の向きを維持するため、最後に押されていたキーの向きを維持します。
      if (this.lastDirection !== 'turn') {
        newAnimKey = this.lastDirection;
      }
    }

    // 現在のアニメーションと新しいアニメーションが異なる場合のみ、再生処理を実行（パフォーマンス向上）
    if (this.anims.currentAnim?.key !== newAnimKey) {
      this.anims.play(newAnimKey!, true);
    }
  }

  /**
   * HPを回復します。
   * @param {number} amount - 回復量。
   */
  heal(amount: number) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  /**
   * ダメージを受けます。
   * @param {number} amount - ダメージ量。
   */
  damage(amount: number) {
    // 死亡状態または無敵状態の場合は、ダメージを受けない
    if (this.state === PlayerState.DEAD || this.state === PlayerState.INVINCIBLE) return;

    this.health = Math.max(this.health - amount, 0); // HPを減らす（0未満にはならない）
    if (this.health === 0) {
      // HPが0になったら死亡状態に遷移
      this.transitionToState(PlayerState.DEAD);
    }
  }

  /**
   * オブジェクトを破棄する際のクリーンアップ処理。
   * @param {boolean} [fromScene] - シーンからの呼び出しかどうか。
   */
  destroy(fromScene?: boolean) {
    // 無敵状態のタイマーやTweenが残っている可能性があるので、安全に破棄します。
    if (this.invincibleTimer) {
      this.invincibleTimer.destroy();
      this.invincibleTimer = undefined;
    }
    if (this.scene) {
      this.scene.tweens.killTweensOf(this);
    }

    // 親クラスのdestroyを呼び出し、基本的な破棄処理を実行します。
    super.destroy(fromScene);
  }
}
