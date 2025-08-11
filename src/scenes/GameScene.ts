import Phaser from 'phaser';
import Player, { PlayerState } from '../features/player/Player';
import Enemy from '../features/enemies/Enemy';
import { IAIController, WanderController } from '../features/enemies/ai';
import Coin from '../features/items/Coin';
import Key from '../features/items/Key';
import Castle from '../features/castle/Castle';
import MapLoader, { MapObjects } from '../core/data/MapLoader';
import Heart from '../features/items/Heart';
import CollisionSystem from '../core/systems/CollisionSystem';
import GameUIView from '../ui/views/GameUIView';

/**
 * @class GameScene
 * @extends Phaser.Scene
 * @description
 * メインのゲームプレイシーン。
 * このシーンは、プレイヤー、敵、アイテム、マップなどのゲームオブジェクトを生成し、
 * それらの間のインタラクション（衝突判定など）を管理します。
 * また、UIの表示やユーザー入力の処理も担当する、ゲームの中核となるクラスです。
 *
 * 設計思想:
 * このシーンは、各種オブジェクトやシステムを統括する「司令塔」の役割を担います。
 * オブジェクトの生成、物理演算の設定、衝突イベントのハンドリングなど、
 * ゲームのロジックの多くがここに集約されています。
 * 処理を `setupWorld`, `createPlayer` のように機能ごとにメソッド分割することで、
 * `create`メソッドが長大になるのを防ぎ、可読性を高めています。
 */
export default class GameScene extends Phaser.Scene {
  // --- プロパティ定義 ---

  // ゲームオブジェクト
  private player!: Player; // プレイヤーオブジェクト。`!`は後で必ず初期化されることを示す。
  private platforms!: Phaser.Physics.Arcade.StaticGroup; // 足場プラットフォーム
  private enemies!: Phaser.Physics.Arcade.Group; // 敵グループ
  private coins!: Phaser.Physics.Arcade.Group; // コイングループ
  private hearts!: Phaser.Physics.Arcade.Group; // ハートグループ
  private keys!: Phaser.Physics.Arcade.Group; // 鍵グループ
  private castle?: Castle; // 城オブジェクト

  // 状態管理
  private hasKey = false; // 鍵を持っているかどうかのフラグ
  private currentEnemy?: Enemy; // 現在戦闘中の敵

  // システムとUI
  private collisionSystem!: CollisionSystem; // 衝突判定システム
  private gameUIView!: GameUIView; // ゲーム画面のUIビュー

  // 入力
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; // カーソルキー
  private escKey?: Phaser.Input.Keyboard.Key; // ESCキー

  // ステージデータ
  private currentStageId?: string; // 現在のステージID
  private currentMapPath?: string; // 現在のマップファイルのパス

  // --- Phaserシーンのライフサイクルメソッド ---

  /**
   * GameSceneのコンストラクタ。
   * シーンのキーを'GameScene'として登録します。
   */
  constructor() {
    super('GameScene');
  }

  /**
   * シーンが開始されるときに呼び出される初期化メソッド。
   * 他のシーンから渡されたデータ（ステージIDなど）を受け取ります。
   * @param {{ stageId?: string; mapPath?: string }} data - 初期化データ。
   */
  init(data: { stageId?: string; mapPath?: string }) {
    // ステージデータをプロパティに保存
    this.currentStageId = data.stageId || 'level1';
    this.currentMapPath = data.mapPath || 'assets/maps/level1.json';

    // ゲーム状態をリセット
    this.hasKey = false;
    this.currentEnemy = undefined;
  }

  /**
   * アセットのプリロードを行うメソッド。
   * このゲームでは`PreloadScene`で全てのアセットを読み込んでいるため、ここは空です。
   */
  preload() {
    // PreloadSceneでアセットは読み込み済みのため、このメソッドは空にします。
  }

  /**
   * シーンが生成されるときに一度だけ呼び出されるメソッド。
   * ゲームオブジェクトの生成、イベントリスナーの設定など、シーンの主要なセットアップを行います。
   */
  create() {
    // 1. マップデータを読み込む
    const mapData = this.cache.json.get(this.currentStageId!);
    if (!mapData) {
      throw new Error(`Map data for ${this.currentStageId} could not be loaded.`);
    }
    const mapObjects = MapLoader.load(mapData);

    // 2. ワールド、入力、イベントリスナーのセットアップ
    this.setupWorld(mapObjects.backgroundKey);
    this.setupInput();
    this.setupEventListeners();

    // 3. グループとマップオブジェクトの生成
    this.createGroups();
    this.createMapObjects(mapObjects);
    this.createPlayer(mapObjects.player);

    // 4. UIと衝突システムの生成
    this.gameUIView = new GameUIView(this);
    this.gameUIView.create(this.player);

    this.collisionSystem = new CollisionSystem(this);
    this.collisionSystem.setupCollisions(this.player as any, this.platforms, this.coins, this.enemies, this.hearts, this.keys, this.castle);

    // 5. カメラ設定
    this.cameras.main.startFollow(this.player); // カメラがプレイヤーを追従するように
    this.cameras.main.setLerp(1, 1); // カメラの追従を滑らかにしない（キビキビ動かす）

    // 6. シーン終了時のクリーンアップ処理を登録
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  /**
   * 毎フレーム呼び出される更新処理。
   * @param {number} time - ゲームの総経過時間。
   * @param {number} delta - 前のフレームからの経過時間。
   */
  update(time: number, delta: number) {
    if (!this.player || !this.player.body) return;

    // キー入力の状態を取得
    const leftIsDown = this.cursors.left?.isDown ?? false;
    const rightIsDown = this.cursors.right?.isDown ?? false;
    const jumpIsDown = (this.cursors.up?.isDown || this.cursors.space?.isDown) ?? false;

    // プレイヤーとUIを更新
    this.player.update(leftIsDown, rightIsDown, jumpIsDown);
    this.gameUIView.updateHp(this.player.health);
  }

  // --- Private Methods for Setup ---

  /**
   * ワールド（背景、物理境界、プラットフォーム）をセットアップします。
   * @param {string} backgroundKey - 背景に使用するテクスチャのキー。
   */
  private setupWorld(backgroundKey: string): void {
    // 背景画像（タイル状に表示）
    this.add.tileSprite(0, 0, 1600, 320, backgroundKey).setOrigin(0, 0).setScrollFactor(0);
    // 地面（見た目のみ）
    this.add.rectangle(0, 300, this.game.config.width as number, 20, 0x000000).setOrigin(0, 0).setScrollFactor(0);

    // 物理ワールドとカメラの境界を設定
    const mapWidth = 1600;
    const mapHeight = 300;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // プラットフォームを生成
    this.platforms = this.physics.add.staticGroup();
    for (let x = 200; x <= 1400; x += 400) {
      this.platforms.create(x, 260, 'ground').setScale(2).refreshBody();
    }
  }

  /**
   * ユーザー入力をセットアップします。
   */
  private setupInput(): void {
    this.input.keyboard!.enabled = true;
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', this.onEscKey, this);
  }

  /**
   * シーン内で発生するカスタムイベントのリスナーをセットアップします。
   * 設計思想: イベント駆動アーキテクチャ。
   * 各システム（CollisionSystemなど）は、衝突などのイベントが発生した際に、
   * 自身で処理を完結させるのではなく、シーンに対してイベントを発行します。
   * GameSceneはこのイベントをリッスンし、ゲーム全体の文脈に沿った処理（スコア加算、クイズシーンへの遷移など）を実行します。
   * これにより、各システムの責務が明確になり、コードの結合度が低く保たれます。
   */
  private setupEventListeners(): void {
    this.events.on('quiz-completed', this.handleQuizResult, this);
    this.events.on('pause', this.onScenePause, this);
    this.events.on('resume', this.onSceneResume, this);

    // CollisionSystemからのイベントをリッスン
    this.events.on('coin-collected', this.handleCoinCollected, this);
    this.events.on('enemy-collided', this.handleEnemyCollision, this);
    this.events.on('heart-collected', this.handleHeartCollected, this);
    this.events.on('key-collected', this.handleKeyCollected, this);
    this.events.on('castle-collided', this.handleCastleCollision, this);
  }

  /**
   * ゲームオブジェクトを管理するためのグループを生成します。
   * グループ化することで、同種のオブジェクトを一括で処理できます。
   */
  private createGroups(): void {
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.coins = this.physics.add.group({ classType: Coin, maxSize: 50 });
    this.hearts = this.physics.add.group({ classType: Heart, maxSize: 20 });
    this.keys = this.physics.add.group({ classType: Key, maxSize: 1 });
  }

  /**
   * マップデータに基づいて、敵やアイテムなどのオブジェクトを生成・配置します。
   * @param {MapObjects} mapObjects - MapLoaderによって解析されたオブジェクトデータ。
   */
  private createMapObjects(mapObjects: MapObjects): void {
    // 敵を生成
    mapObjects.enemies.forEach(e => {
      const enemy = this.enemies.get(e.x, e.y) as Enemy;
      if (enemy) {
        const bounds = new Phaser.Geom.Rectangle(e.x - 100, e.y - 100, 200, 100);
        const aiController = new WanderController(bounds, enemy);
        enemy.initialize(aiController);
      }
    });
    // コインを生成
    mapObjects.coins.forEach(c => {
      const coin = this.coins.get(c.x, c.y) as Coin;
      if (coin) coin.initialize();
    });
    // ハートを生成
    mapObjects.hearts.forEach(h => {
      const heart = this.hearts.get(h.x, h.y) as Heart;
      if (heart) heart.initialize();
    });
    // 鍵を生成
    if (mapObjects.keys.length > 0) {
      const keyConfig = mapObjects.keys[0];
      const key = this.keys.get(keyConfig.x, keyConfig.y) as Key;
      if (key) key.initialize();
    }
    // 城を生成
    if (mapObjects.castles.length > 0) {
      const castleConfig = mapObjects.castles[0];
      this.castle = new Castle(this, castleConfig.x, castleConfig.y);
      this.castle.initialize();
    }
  }

  /**
   * プレイヤーオブジェクトを生成し、アニメーションを設定します。
   * @param {any} playerConfig - プレイヤーの配置情報。
   */
  private createPlayer(playerConfig: any): void {
    if (!playerConfig) {
      throw new Error('Map data does not define a player.');
    }
    this.player = new Player(this, playerConfig.x, playerConfig.y);
    this.player.setDepth(10); // 他のオブジェクトより手前に表示

    // 死亡アニメーション完了イベントをリッスン
    this.player.on('death-animation-complete', () => {
      this.scene.start('GameOverScene', {
        stageId: this.currentStageId,
        mapPath: this.currentMapPath,
        score: this.gameUIView.getScore()
      });
    });

    // プレイヤーの状態変化をリッスン
    this.player.on('state-changed', (newState: PlayerState) => {
      if (newState === PlayerState.DEAD) {
        this.cameras.main.stopFollow();
      }
    });

    // プレイヤーのアニメーションを生成
    if (!this.anims.exists('left')) {
      this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    }
    if (!this.anims.exists('turn')) {
      this.anims.create({ key: 'turn', frames: [{ key: 'player', frame: 4 }], frameRate: 20 });
    }
    if (!this.anims.exists('right')) {
      this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });
    }

    this.player.initialize(); // アニメーション生成後に初期化
  }

  // --- Event Handlers ---

  private handleCoinCollected(coin: Coin): void {
    this.gameUIView.updateScore(coin.value ?? 1);
    this.coins.killAndHide(coin); // オブジェクトプールに戻す
    if (coin.body instanceof Phaser.Physics.Arcade.Body) {
      coin.body.enable = false;
    }
  }

  private handleEnemyCollision(player: Player, enemy: Enemy): void {
    if (!enemy.active) return;

    this.currentEnemy = enemy;
    if (this.player.body) this.player.body.enable = false; // プレイヤーの動きを止める
    if (enemy.body) enemy.body.enable = false; // 敵の動きを止める

    this.input.keyboard!.enabled = false; // ゲームシーンのキー入力を無効化
    const category = this.registry.get('selectedQuizCategory') || 'general';
    this.scene.pause(); // このシーンを一時停止
    this.scene.launch('QuizScene', { category: category, returnSceneKey: this.scene.key }); // クイズシーンを起動
  }

  private handleHeartCollected(heart: Heart): void {
    this.player.heal(heart.healAmount ?? 1);
    this.hearts.killAndHide(heart);
    if (heart.body instanceof Phaser.Physics.Arcade.Body) {
      heart.body.enable = false;
    }
  }

  private handleKeyCollected(key: Key): void {
    this.hasKey = true;
    this.keys.killAndHide(key);
    if (key.body instanceof Phaser.Physics.Arcade.Body) {
      key.body.enable = false;
    }
  }

  private handleCastleCollision(castle: Castle): void {
    if (this.hasKey) {
      this.scene.start('ClearScene', {
        stageId: this.currentStageId,
        mapPath: this.currentMapPath,
        score: this.gameUIView.getScore()
      });
    }
  }

  /**
   * クイズシーンからの結果を受け取って処理します。
   * @param {boolean} isCorrect - クイズが正解だったか。
   */
  private handleQuizResult(isCorrect: boolean): void {
    if (isCorrect) {
      // 正解なら敵を倒す
      if (this.currentEnemy?.active) {
        this.currentEnemy.destroy();
      }
    } else {
      // 不正解ならダメージを受け、無敵状態に
      this.player.damage(1);
      if (this.player.state !== PlayerState.DEAD) {
        this.player.transitionToState(PlayerState.INVINCIBLE);
      }
      // 敵の動きを再開
      if (this.currentEnemy?.body) {
        this.currentEnemy.body.enable = true;
      }
    }

    if (this.player.body) this.player.body.enable = true; // プレイヤーの動きを再開
    this.scene.resume(); // このシーンを再開
    this.currentEnemy = undefined;
  }

  /**
   * シーンがシャットダウンまたは破棄されるときに呼び出されるクリーンアップ処理。
   * メモリリークを防ぐために、登録したイベントリスナーをすべて解除します。
   */
  private cleanup(): void {
    if (this.player) {
      this.player.off('death-animation-complete');
    }
    this.events.off('quiz-completed', this.handleQuizResult, this);
    this.events.off('pause', this.onScenePause, this);
    this.events.off('resume', this.onSceneResume, this);
    this.escKey?.off('down', this.onEscKey, this);

    this.events.off('coin-collected', this.handleCoinCollected, this);
    this.events.off('enemy-collided', this.handleEnemyCollision, this);
    this.events.off('heart-collected', this.handleHeartCollected, this);
    this.events.off('key-collected', this.handleKeyCollected, this);
    this.events.off('castle-collided', this.handleCastleCollision, this);
  }

  // --- Scene Pause/Resume Handlers ---
  private onScenePause = () => {
    // ポーズ中の処理（現在は空）
  };
  private onSceneResume = () => {
    this.input.keyboard!.enabled = true;
    if (this.player?.body) this.player.body.enable = true;
  };

  // --- ESC Key Handler ---
  private onEscKey = () => {
    this.scene.pause();
    this.scene.launch('PauseOverlayScene', {
      stageId: this.currentStageId,
      mapPath: this.currentMapPath,
      returnScene: 'GameScene'
    });
  };
}
