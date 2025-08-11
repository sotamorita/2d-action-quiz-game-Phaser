import Phaser from 'phaser';
import Player from '../objects/Player';
import Coin from '../objects/Coin';
import Enemy from '../objects/Enemy';
import Heart from '../objects/Heart';
import Key from '../objects/Key';
import Castle from '../objects/Castle';

/**
 * 当たり判定を管理し、イベントを発行するクラス
 */
export default class CollisionManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * すべての当たり判定を設定する
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
    // プレイヤーと地面
    this.scene.physics.add.collider(player, platforms);

    // 敵と地面
    this.scene.physics.add.collider(enemies, platforms);

    // 敵同士
    this.scene.physics.add.collider(enemies, enemies);

    // --- overlap ---
    // Playerとコインの当たり判定
    this.scene.physics.add.overlap(player, coins, this.handlePlayerCoinCollision, undefined, this);

    // Playerと敵の当たり判定
    this.scene.physics.add.overlap(player, enemies, this.handlePlayerEnemyCollision, undefined, this);

    // Playerとハートの当たり判定
    this.scene.physics.add.overlap(player, hearts, this.handlePlayerHeartCollision, undefined, this);

    // Playerと鍵の当たり判定
    this.scene.physics.add.overlap(player, keys, this.handlePlayerKeyCollision, undefined, this);

    // Playerと城の当たり判定
    if (castle) {
      this.scene.physics.add.overlap(player, castle, this.handlePlayerCastleCollision, undefined, this);
    }
  }

  /**
   * PlayerとCoinが衝突したときの処理
   */
  private handlePlayerCoinCollision(player: any, coin: any): void {
    this.scene.events.emit('coin-collected', coin as Coin);
  }

  /**
   * PlayerとEnemyが衝突したときの処理
   */
  private handlePlayerEnemyCollision(player: any, enemy: any): void {
    this.scene.events.emit('enemy-collided', player as Player, enemy as Enemy);
  }

  /**
   * PlayerとHeartが衝突したときの処理
   */
  private handlePlayerHeartCollision(player: any, heart: any): void {
    this.scene.events.emit('heart-collected', heart as Heart);
  }

  /**
   * PlayerとKeyが衝突したときの処理
   */
  private handlePlayerKeyCollision(player: any, key: any): void {
    this.scene.events.emit('key-collected', key as Key);
  }

  /**
   * PlayerとCastleが衝突したときの処理
   */
  private handlePlayerCastleCollision(player: any, castle: any): void {
    this.scene.events.emit('castle-collided', castle as Castle);
  }
}
