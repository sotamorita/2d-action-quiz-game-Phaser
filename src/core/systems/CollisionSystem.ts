import Phaser from 'phaser';
import Player, { PlayerState } from '../../features/player/Player';
import Coin from '../../features/items/Coin';
import Enemy from '../../features/enemies/Enemy';
import Heart from '../../features/items/Heart';
import Key from '../../features/items/Key';
import Castle from '../../features/castle/Castle';

/**
 * @class CollisionSystem
 * @description
 * ゲーム内のすべての衝突判定（当たり判定）を管理し、関連するイベントを発行するクラス。
 *
 * 設計思想:
 * このクラスは、衝突判定のロジックを`GameScene`から分離し、責務を単一に保つことを目的としています。
 * `CollisionSystem`は「何と何が衝突したか」を検知するだけで、
 * 「衝突した結果、何が起こるか（スコアが増える、ダメージを受けるなど）」という具体的な処理は行いません。
 * 代わりに、`'coin-collected'`のようなセマンティックな（意味のある）名前のイベントをシーンに発行します。
 *
 * この設計（イベント駆動）により、`GameScene`は衝突の詳細を知る必要がなく、
 * 発行されたイベントに応じてゲームの状態を更新するだけで済みます。
 * これにより、コードの結合度が下がり、保守性や拡張性が向上します。
 */
export default class CollisionSystem {
  private scene: Phaser.Scene;

  /**
   * CollisionSystemのインスタンスを生成します。
   * @param {Phaser.Scene} scene - このシステムが属するシーン。
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * すべての衝突判定を設定します。GameSceneの`create`メソッドから呼び出されます。
   * @param {Player} player - プレイヤーオブジェクト。
   * @param {Phaser.Physics.Arcade.StaticGroup} platforms - プラットフォームグループ。
   * @param {Phaser.Physics.Arcade.Group} coins - コイングループ。
   * @param {Phaser.Physics.Arcade.Group} enemies - 敵グループ。
   * @param {Phaser.Physics.Arcade.Group} hearts - ハートグループ。
   * @param {Phaser.Physics.Arcade.Group} keys - 鍵グループ。
   * @param {Castle | undefined} castle - 城オブジェクト。
   */
  public setupCollisions(
    player: Player,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    coins: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group,
    hearts: Phaser.Physics.Arcade.Group,
    keys: Phaser.Physics.Arcade.Group,
    castle: Castle | undefined
  ): void {
    // --- collider: 物理的な反発を伴う衝突 ---
    // プレイヤーとプラットフォーム
    this.scene.physics.add.collider(player, platforms);

    // 敵とプラットフォーム
    this.scene.physics.add.collider(enemies, platforms);

    // 敵同士（お互いに重ならないように）
    this.scene.physics.add.collider(enemies, enemies);

    // --- overlap: 物理的な反発を伴わない接触（すり抜ける） ---
    // プレイヤーとコイン
    this.scene.physics.add.overlap(player, coins, this.handlePlayerCoinCollision, undefined, this);

    // プレイヤーと敵
    this.scene.physics.add.overlap(player, enemies, this.handlePlayerEnemyCollision, undefined, this);

    // プレイヤーとハート
    this.scene.physics.add.overlap(player, hearts, this.handlePlayerHeartCollision, undefined, this);

    // プレイヤーと鍵
    this.scene.physics.add.overlap(player, keys, this.handlePlayerKeyCollision, undefined, this);

    // プレイヤーと城
    if (castle) {
      this.scene.physics.add.overlap(player, castle as any, this.handlePlayerCastleCollision, undefined, this);
    }
  }

  /**
   * プレイヤーとコインが接触したときの処理。
   * 'coin-collected'イベントを発行します。
   */
  private handlePlayerCoinCollision(player: any, coin: any): void {
    this.scene.events.emit('coin-collected', coin as Coin);
  }

  /**
   * プレイヤーと敵が接触したときの処理。
   * 'enemy-collided'イベントを発行します。
   */
  private handlePlayerEnemyCollision(player: any, enemy: any): void {
    const playerObject = player as Player;
    // プレイヤーが死亡状態または無敵状態の場合は、何もしない
    if (playerObject.state === PlayerState.DEAD || playerObject.state === PlayerState.INVINCIBLE) return;
    this.scene.events.emit('enemy-collided', playerObject, enemy as Enemy);
  }

  /**
   * プレイヤーとハートが接触したときの処理。
   * 'heart-collected'イベントを発行します。
   */
  private handlePlayerHeartCollision(player: any, heart: any): void {
    this.scene.events.emit('heart-collected', heart as Heart);
  }

  /**
   * プレイヤーと鍵が接触したときの処理。
   * 'key-collected'イベントを発行します。
   */
  private handlePlayerKeyCollision(player: any, key: any): void {
    this.scene.events.emit('key-collected', key as Key);
  }

  /**
   * プレイヤーと城が接触したときの処理。
   * 'castle-collided'イベントを発行します。
   */
  private handlePlayerCastleCollision(player: any, castle: any): void {
    this.scene.events.emit('castle-collided', castle as Castle);
  }
}
