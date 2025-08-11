import Phaser from 'phaser';
import Player, { PlayerConfig } from '../objects/Player';
import Enemy from '../objects/Enemy';
import Coin from '../objects/Coin';
import Key from '../objects/Key';
import Castle from '../objects/Castle';
import MapLoader from '../objects/MapLoader';
import Heart, { HeartConfig } from '../objects/Heart';
import { RetroUI } from '../ui/RetroUI';
import CollisionManager from '../systems/CollisionManager';
import GameUI from '../ui/GameUI';
import { MapObjects } from '../objects/MapLoader';
import { EnemyConfig } from '../objects/Enemy';
import { CoinConfig } from '../objects/Coin';

const INVINCIBILITY_DURATION = 3000; // 3秒の無敵時間

export default class GameScene extends Phaser.Scene {
  // オブジェクト
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private hearts!: Phaser.Physics.Arcade.Group;
  private keys!: Phaser.Physics.Arcade.Group;
  private castle?: Castle;

  // 状態管理
  private hasKey = false;
  private currentEnemy?: Enemy;

  // システムとUI
  private collisionManager!: CollisionManager;
  private gameUI!: GameUI;

  // 入力
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private escKey?: Phaser.Input.Keyboard.Key;

  // ステージデータ
  private currentStageId?: string;
  private currentMapPath?: string;

  // Scene event handlers (for cleanup)
  private onScenePause = () => {
    // グローバルなキーボード入力を無効化すると、他のシーンに影響が出るため削除
    // this.input.keyboard!.enabled = false;
  };
  private onSceneResume = () => {
    this.input.keyboard!.enabled = true;
    if (this.player?.body) this.player.body.enable = true;
  };

  // Escキーハンドラー（PauseOverlayScene呼び出し用）
  private onEscKey = () => {
    // Phaserの標準機能でシーンを一時停止
    this.scene.pause();

    // PauseOverlaySceneを起動
    this.scene.launch('PauseOverlayScene', {
      stageId: this.currentStageId,
      mapPath: this.currentMapPath,
      returnScene: 'GameScene'
    });
  };

  constructor() {
    super('GameScene');
  }

  init(data: { stageId?: string; mapPath?: string }) {
    // ステージデータを受け取り
    this.currentStageId = data.stageId || 'level1';
    this.currentMapPath = data.mapPath || 'assets/maps/level1.json';

    // ゲーム状態をリセット
    this.hasKey = false;
    this.currentEnemy = undefined;
  }

  preload() {
    // PreloadSceneでアセットは読み込み済みのため、このメソッドは空にします。
  }

  create() {
    this.setupWorld();
    this.setupInput();
    this.setupEventListeners();

    const mapData = this.cache.json.get(this.currentStageId!);
    if (!mapData) {
      throw new Error(`Map data for ${this.currentStageId} could not be loaded.`);
    }
    const mapObjects = MapLoader.load(mapData);

    this.createGroups();
    this.createMapObjects(mapObjects);
    this.createPlayer(mapObjects.player);

    this.gameUI = new GameUI(this);
    this.gameUI.create(this.player);

    this.collisionManager = new CollisionManager(this);
    this.collisionManager.setupCollisions(this.player, this.platforms, this.coins, this.enemies, this.hearts, this.keys, this.castle);

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setLerp(1, 1);

    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  update() {
    if (!this.player || !this.player.body) return;

    const leftIsDown = this.cursors.left?.isDown ?? false;
    const rightIsDown = this.cursors.right?.isDown ?? false;
    const jumpIsDown = (this.cursors.up?.isDown || this.cursors.space?.isDown) ?? false;

    this.player.update(leftIsDown, rightIsDown, jumpIsDown);
    this.gameUI.updateHp(this.player.health);
  }





  // --- Private Methods for Setup ---

  private setupWorld(): void {
    this.add.tileSprite(0, 0, 1600, 320, 'background').setOrigin(0, 0);
    this.add.rectangle(0, 300, this.game.config.width as number, 20, 0x000000).setOrigin(0, 0).setScrollFactor(0);

    const mapWidth = 1600;
    const mapHeight = 300;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    this.platforms = this.physics.add.staticGroup();
    for (let x = 200; x <= 1400; x += 400) {
      this.platforms.create(x, 260, 'ground').setScale(2).refreshBody();
    }
  }

  private setupInput(): void {
    this.input.keyboard!.enabled = true;
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', this.onEscKey, this);
  }

  private setupEventListeners(): void {
    this.events.on('quiz-completed', this.handleQuizResult, this);
    this.events.on('pause', this.onScenePause, this);
    this.events.on('resume', this.onSceneResume, this);

    // CollisionManagerからのイベントをリッスン
    this.events.on('coin-collected', this.handleCoinCollected, this);
    this.events.on('enemy-collided', this.handleEnemyCollision, this);
    this.events.on('heart-collected', this.handleHeartCollected, this);
    this.events.on('key-collected', this.handleKeyCollected, this);
    this.events.on('castle-collided', this.handleCastleCollision, this);
  }

  private createGroups(): void {
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.coins = this.physics.add.group({ classType: Coin, maxSize: 50 });
    this.hearts = this.physics.add.group({ classType: Heart, maxSize: 20 });
    this.keys = this.physics.add.group({ classType: Key, maxSize: 1 });
  }

  private createMapObjects(mapObjects: MapObjects): void {
    mapObjects.enemies.forEach(e => {
      const enemy = this.enemies.get(e.x, e.y) as Enemy;
      if (enemy) enemy.initialize(e.properties as EnemyConfig);
    });
    mapObjects.coins.forEach(c => {
      const coin = this.coins.get(c.x, c.y) as Coin;
      if (coin) coin.initialize(c.properties as CoinConfig);
    });
    mapObjects.hearts.forEach(h => {
      const heart = this.hearts.get(h.x, h.y) as Heart;
      if (heart) heart.initialize(h.properties as HeartConfig);
    });

    if (mapObjects.keys.length > 0) {
      const keyConfig = mapObjects.keys[0];
      const key = this.keys.get(keyConfig.x, keyConfig.y) as Key;
      if (key) {
        key.initialize(keyConfig.properties);
      }
    }
    if (mapObjects.castles.length > 0) {
      const castleConfig = mapObjects.castles[0];
      this.castle = new Castle(this, castleConfig.x, castleConfig.y, castleConfig.properties);
      this.castle.initialize();
    }
  }

  private createPlayer(playerConfig: any): void {
    if (!playerConfig) {
      throw new Error('Map data does not define a player.');
    }
    this.player = new Player(this, playerConfig.x, playerConfig.y, playerConfig.properties as PlayerConfig);
    this.player.setDepth(10);
    this.player.initialize();

    if (!this.anims.exists('left')) {
      this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    }
    if (!this.anims.exists('turn')) {
      this.anims.create({ key: 'turn', frames: [{ key: 'player', frame: 4 }], frameRate: 20 });
    }
    if (!this.anims.exists('right')) {
      this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });
    }
  }

  // --- Event Handlers ---

  private handleCoinCollected(coin: Coin): void {
    this.gameUI.updateScore(coin.value ?? 1);
    this.coins.killAndHide(coin);
    if (coin.body instanceof Phaser.Physics.Arcade.Body) {
      coin.body.enable = false;
    }
  }

  private handleEnemyCollision(player: Player, enemy: Enemy): void {
    if (this.player.isInvincible || !enemy.active) return;

    this.currentEnemy = enemy;
    if (this.player.body) this.player.body.enable = false;
    if (enemy.body) enemy.body.enable = false;

    this.input.keyboard!.enabled = false;
    const category = this.registry.get('selectedQuizCategory') || 'general';
    this.scene.pause();
    this.scene.launch('QuizScene', { category: category, returnSceneKey: this.scene.key });
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
        score: this.gameUI.getScore()
      });
    }
  }

  private handleQuizResult(isCorrect: boolean): void {
    if (isCorrect) {
      if (this.currentEnemy?.active) {
        this.currentEnemy.destroy();
      }
    } else {
      this.player.damage(1);
      this.player.startInvincibility(INVINCIBILITY_DURATION);

      if (this.player.health <= 0) {
        this.scene.stop();
        this.scene.start('GameOverScene', {
          stageId: this.currentStageId,
          mapPath: this.currentMapPath,
          score: this.gameUI.getScore()
        });
        return;
      }

      if (this.currentEnemy?.body) {
        this.currentEnemy.body.enable = true;
      }
    }

    if (this.player.body) this.player.body.enable = true;
    this.scene.resume();
    this.currentEnemy = undefined;
  }

  private cleanup(): void {
    this.events.off('quiz-completed', this.handleQuizResult, this);
    this.events.off('pause', this.onScenePause, this);
    this.events.off('resume', this.onSceneResume, this);
    this.escKey?.off('down', this.onEscKey, this);

    // イベントリスナーを削除
    this.events.off('coin-collected', this.handleCoinCollected, this);
    this.events.off('enemy-collided', this.handleEnemyCollision, this);
    this.events.off('heart-collected', this.handleHeartCollected, this);
    this.events.off('key-collected', this.handleKeyCollected, this);
    this.events.off('castle-collided', this.handleCastleCollision, this);
  }
}
