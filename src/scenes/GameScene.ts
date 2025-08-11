import Phaser from 'phaser';
import Player from '../objects/Player';
import Enemy from '../objects/Enemy';
import Coin from '../objects/Coin';
import Key from '../objects/Key';
import Castle from '../objects/Castle';
import MapLoader from '../objects/MapLoader';
import Heart from '../objects/Heart';
import { RetroUI } from '../ui/RetroUI';
import VirtualControls from '../ui/VirtualControls'; // VirtualControlsをインポート

export default class GameScene extends Phaser.Scene {
  player!: Player;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  virtualControls?: VirtualControls; // VirtualControlsのインスタンス

  platforms!: Phaser.Physics.Arcade.StaticGroup;

  enemies!: Phaser.Physics.Arcade.Group;
  coins!: Phaser.Physics.Arcade.Group;
  hearts!: Phaser.Physics.Arcade.Group;

  score = 0;
  scoreText!: Phaser.GameObjects.Text;
  hpText!: Phaser.GameObjects.Text;

  key?: Key;
  hasKey = false;

  castle?: Castle;

  // ステージデータ（PauseOverlayScene用）
  private currentStageId?: string;
  private currentMapPath?: string;

  // Colliders
  enemyCollider?: Phaser.Physics.Arcade.Collider;
  coinCollider?: Phaser.Physics.Arcade.Collider;
  heartCollider?: Phaser.Physics.Arcade.Collider;
  keyCollider?: Phaser.Physics.Arcade.Collider;
  castleCollider?: Phaser.Physics.Arcade.Collider;

  // Enemy ref during quiz
  currentEnemy?: Enemy;

  // Scene event handlers (for cleanup)
  private onScenePause = () => {
    this.input.keyboard!.enabled = false;
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

    // ゲーム状態を明示的にリセット（他シーンからの復帰時の一貫性確保）
    this.score = 0;
    this.hasKey = false;
    this.currentEnemy = undefined;
  }

  preload() {
    // Player spritesheet
    this.load.spritesheet('player', 'assets/player/player.png', {
      frameWidth: 32,
      frameHeight: 48
    });

    // Images
    this.load.image('background', 'assets/maps/background.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('key', 'assets/key.png');
    this.load.image('castle', 'assets/castle.png');
    this.load.image('heart', 'assets/heart.png');

    // Map JSON (initで受け取ったパスを使用)
    if (this.currentMapPath) {
      this.load.json('map', this.currentMapPath);
    } else {
      console.error('GameScene: mapPath is not provided.');
    }
  }

  create() {
    // 入力状態を確実に初期化（他シーンからの復帰時の一貫性確保）
    this.input.keyboard!.enabled = true;

    // Result from QuizScene
    this.events.on('quiz-completed', this.handleQuizResult, this);

    // pause/resume handlers
    this.events.on('pause', this.onScenePause, this);
    this.events.on('resume', this.onSceneResume, this);

    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();

    // モバイルデバイス検出
    const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;

    if (isMobile) {
      this.virtualControls = new VirtualControls(this);
      this.virtualControls.setVisible(true); // モバイルの場合のみ表示
      this.events.on('virtual-pause-button-down', this.onEscKey, this); // バーチャルポーズボタンのイベントを購読
    } else {
      // デスクトップの場合、Escキー設定（PauseOverlayScene呼び出し用）
      const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', this.onEscKey, this);
    }

    // Background image (tiled to cover the game area)
    const background = this.add.tileSprite(0, 0, 1600, 320, 'background'); // 背景画像の高さを320に調整
    background.setOrigin(0, 0);

    // 黒帯の描画 (背景画像の上に重ねる)
    this.add.rectangle(0, 300, this.game.config.width as number, 20, 0x000000).setOrigin(0, 0).setScrollFactor(0);

    // World & camera
    const mapWidth = 1600;
    const mapHeight = 300; // ゲームのワールドの高さを300に合わせる (地面のY座標)
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // Ground (positioned at Y=300)
    this.platforms = this.physics.add.staticGroup();
    // Create multiple platforms across the world width
    for (let x = 200; x <= 1400; x += 400) {
      this.platforms.create(x, 260, 'ground').setScale(2).refreshBody(); // 地面の位置を260に調整
    }

    // Load map objects
    const mapData = this.cache.json.get('map');
    if (!mapData) {
      throw new Error(`Map data from ${this.currentMapPath} could not be loaded. Check path or JSON syntax.`);
    }
    const objects = MapLoader.load(this, mapData, this.cursors);

    // Player
    if (!objects.player) {
      throw new Error('マップデータにプレイヤーが定義されていません');
    }
    this.player = objects.player;
    this.player.setDepth(10);
    this.physics.add.collider(this.player, this.platforms);

    // プレイヤーの物理ボディを確実に有効化（他シーンからの復帰時の一貫性確保）
    if (this.player?.body) {
      this.player.body.enable = true;
    }

    // Camera follow
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setLerp(1, 1);

    // Animations (guard against re-register)
    if (!this.anims.exists('left')) {
      this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!this.anims.exists('turn')) {
      this.anims.create({
        key: 'turn',
        frames: [{ key: 'player', frame: 4 }],
        frameRate: 20
      });
    }
    if (!this.anims.exists('right')) {
      this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
      });
    }

    // --- UI first (avoid race if overlaps fire immediately) ---
    this.scoreText = RetroUI.createSimpleText(this, 16, 16, 'Score: 0', {
      fontSize: '16px'
    }).setScrollFactor(0);

    this.hpText = RetroUI.createSimpleText(this, 16, 32, `HP: ${this.player.health}`, {
      fontSize: '16px'
    }).setScrollFactor(0);

    // 操作説明の追加
    RetroUI.createSimpleText(this, 16, 305, '基本操作: [矢印キー/WASD] 移動 / ゲーム: [S]セーブ [L]ロード [R]リセット [Q]タイトル', { // 操作説明を1行にまとめ、Y座標を調整
      fontSize: '12px' // フォントサイズを12pxに拡大
    }).setScrollFactor(0);

    // Groups
    this.enemies = this.physics.add.group();
    objects.enemies.forEach(e => this.enemies.add(e));

    this.coins = this.physics.add.group(objects.coins);
    this.hearts = this.physics.add.group(objects.hearts);

    if (objects.keys && objects.keys.length > 0) {
      this.key = objects.keys[0];
    }
    if (objects.castles && objects.castles.length > 0) {
      this.castle = objects.castles[0];
    }

    // Overlaps & collisions
    this.enemyCollider = this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyCollision as any,
      undefined,
      this
    );

    this.coinCollider = this.physics.add.overlap(
      this.player,
      this.coins,
      (playerObj: any, coinObj: any) => {
        const coin = coinObj as Coin;
        coin.destroy();
        this.score += coin.value ?? 1;
        this.scoreText.setText(`Score: ${this.score}`);
      },
      undefined,
      this
    );

    this.heartCollider = this.physics.add.overlap(
      this.player,
      this.hearts,
      (playerObj: any, heartObj: any) => {
        const heart = heartObj as Heart;
        heart.destroy();
        this.player.heal(heart.healAmount ?? 1);
        this.hpText.setText(`HP: ${this.player.health}`);
      },
      undefined,
      this
    );

    if (this.key) {
      this.keyCollider = this.physics.add.overlap(
        this.player,
        this.key,
        this.handleKeyCollision as any,
        undefined,
        this
      );
    }

    if (this.castle) {
      this.castleCollider = this.physics.add.overlap(
        this.player,
        this.castle,
        this.handleCastleCollision as any,
        undefined,
        this
      );
    }

    // Cleanup on shutdown/destroy
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  update() {
    // キーボード入力とバーチャルコントロール入力を統合
    const leftIsDown = this.cursors.left?.isDown || this.virtualControls?.left.isDown || false;
    const rightIsDown = this.cursors.right?.isDown || this.virtualControls?.right.isDown || false;
    const jumpIsDown = (this.cursors.up?.isDown || this.cursors.space?.isDown) || this.virtualControls?.jump.isDown || false;

    // Playerのupdateメソッドに統合された入力状態を渡す
    this.player.update(leftIsDown, rightIsDown, jumpIsDown);
    this.hpText.setText(`HP: ${this.player.health}`);
  }

  private handleEnemyCollision = (_player: any, enemy: any) => {
    if (this.player.isInvincible) return;
    if (!enemy.active) return;

    this.currentEnemy = enemy as Enemy;

    if (this.player.body) this.player.body.enable = false;
    if (enemy.body) enemy.body.enable = false;

    // Disable input to avoid double launch
    this.input.keyboard!.enabled = false;

    this.scene.pause();
    this.scene.launch('QuizScene', {
      category: 'general',
      returnSceneKey: this.scene.key
    });
  };

  private handleQuizResult = (isCorrect: boolean) => {
    if (isCorrect) {
      if (this.currentEnemy && this.currentEnemy.active) {
        this.currentEnemy.destroy();
      }
    } else {
      this.player.damage(1);
      this.player.startInvincibility(3000);

      if (this.player.health <= 0) {
        this.scene.stop();
        this.scene.start('GameOverScene', {
          stageId: this.currentStageId,
          mapPath: this.currentMapPath,
          score: this.score
        });
        return;
      }

      if (this.currentEnemy && this.currentEnemy.body) {
        this.currentEnemy.body.enable = true;
      }
    }

    if (this.player.body) this.player.body.enable = true;

    // Re-enable input (QuizScene closed by itself)
    this.input.keyboard!.enabled = true;

    this.scene.resume();
    this.currentEnemy = undefined;
  };

  private handleKeyCollision = (_player: any, key: any) => {
    this.hasKey = true;
    key.destroy();
    // hintなどあればここで
  };

  private handleCastleCollision = (_player: any, _castle: any) => {
    if (this.hasKey) {
      this.scene.start('ClearScene', {
        stageId: this.currentStageId,
        mapPath: this.currentMapPath,
        score: this.score
      });
    } else {
      // ヒント等
      // console.log('鍵が必要です');
    }
  };

  private cleanup() {
    // Off scene events
    this.events.off('quiz-completed', this.handleQuizResult, this);
    this.events.off('pause', this.onScenePause, this);
    this.events.off('resume', this.onSceneResume, this);

    // Off key events
    // モバイルとデスクトップで異なるクリーンアップ
    const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    if (isMobile) {
      this.events.off('virtual-pause-button-down', this.onEscKey, this);
      this.virtualControls?.destroy(); // バーチャルコントロールを破棄
    } else {
      const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.off('down', this.onEscKey, this);
    }

    // Destroy colliders
    this.enemyCollider?.destroy();
    this.coinCollider?.destroy();
    this.heartCollider?.destroy();
    this.keyCollider?.destroy();
    this.castleCollider?.destroy();
  }
}
