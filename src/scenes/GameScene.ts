import Phaser from 'phaser';
import Player from '../objects/Player';
import Enemy from '../objects/Enemy';
import Coin from '../objects/Coin';
import Key from '../objects/Key';
import Castle from '../objects/Castle';
import MapLoader from '../objects/MapLoader';
import Heart from '../objects/Heart';

export default class GameScene extends Phaser.Scene {
  player!: Player;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  platforms!: Phaser.Physics.Arcade.StaticGroup;
  enemies!: Phaser.Physics.Arcade.Group;
  coins!: Phaser.Physics.Arcade.Group;
  hearts!: Phaser.Physics.Arcade.Group;
  score: number = 0;
  scoreText!: Phaser.GameObjects.Text;
  hpText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  preload() {
    // プレイヤー、敵、地面スプライトの読み込み
    this.load.spritesheet('player', 'assets/player/player.png', {
      frameWidth: 32,
      frameHeight: 48
    });

    this.load.image('ground', 'assets/platform.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('key', 'assets/key.png');
    this.load.image('castle', 'assets/castle.png');
    this.load.image('heart', 'assets/heart.png');

    // マップデータの読み込み（仮: assets/maps/level1.json）
    this.load.json('map', 'assets/maps/level1.json');
  }

  enemyCollider?: Phaser.Physics.Arcade.Collider;
  currentEnemy?: Enemy;

  create() {
    // QuizSceneからの結果を受け取るイベントリスナー
    this.events.on('quiz-completed', this.handleQuizResult, this);

    // pause/resume時の処理
    this.events.on('pause', () => {
      this.input.keyboard!.enabled = false;
    });

    this.events.on('resume', () => {
      this.input.keyboard!.enabled = true;
      // プレイヤー操作を再開
      if (this.player.body) {
        this.player.body.enable = true;
      }
    });
    // キー入力
    this.cursors = this.input.keyboard!.createCursorKeys();

    // ワールドサイズとカメラ設定
    const mapWidth = 1600;
    const mapHeight = 600;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // 地面（StaticGroup）
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 536, 'ground').setScale(2).refreshBody();
    this.platforms.create(1200, 536, 'ground').setScale(2).refreshBody();

    // マップデータからオブジェクト生成
    const mapData = this.cache.json.get('map');
    const objects = MapLoader.load(this, mapData, this.cursors);

    // プレイヤー
    if (!objects.player) {
      throw new Error('マップデータにプレイヤーが定義されていません');
    }
    this.player = objects.player;
    this.player.setDepth(10); // Playerを最前面に描画
    this.physics.add.collider(this.player, this.platforms);

    // カメラ追従
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setLerp(1, 1);

    // アニメーション定義
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'turn',
      frames: [{ key: 'player', frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    // 敵グループ
    this.enemies = this.physics.add.group();
    objects.enemies.forEach(enemy => {
      this.enemies.add(enemy);
    });

    // コイン・鍵・城グループ（必要に応じてグループ化）
    // コイン・ハートグループ
    this.coins = this.physics.add.group(objects.coins);
    this.hearts = this.physics.add.group(objects.hearts);

    // コイン取得処理
    this.physics.add.overlap(this.player, this.coins, (playerObj: any, coinObj: any) => {
      const player = playerObj as Player;
      const coin = coinObj as Coin;
      coin.destroy();
      this.score += coin.value ?? 1;
      this.scoreText.setText(`Score: ${this.score}`);
      // ここでアニメーションやエフェクトを追加可能
    });

    // ハート取得処理
    this.physics.add.overlap(this.player, this.hearts, (playerObj: any, heartObj: any) => {
      const player = playerObj as Player;
      const heart = heartObj as Heart;
      heart.destroy();
      player.heal(heart.healAmount ?? 1);
      this.hpText.setText(`HP: ${player.health}`);
      // ここでアニメーションやエフェクトを追加可能
    });

    // UI表示
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '20px',
      color: '#ffffff'
    }).setScrollFactor(0);

    this.hpText = this.add.text(16, 40, `HP: ${this.player.health}`, {
      fontSize: '20px',
      color: '#ffffff'
    }).setScrollFactor(0);

    // プレイヤーと敵の接触時にクイズ表示
    this.enemyCollider = this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyCollision,
      undefined,
      this
    );
  }

  update() {
    this.player.update();
    // HP表示を毎フレーム更新（必要なら）
    this.hpText.setText(`HP: ${this.player.health}`);
  }

  handleEnemyCollision = (player: any, enemy: any) => {
    // 無敵状態なら何もしない
    if (this.player.isInvincible) {
      return;
    }
    // 既に敵がdestroyされている場合は何もしない
    if (!enemy.active) {
      return;
    }

    // 現在の敵を保存
    this.currentEnemy = enemy as Enemy;

    // プレイヤーと敵のbodyを一時無効化
    if (this.player.body) this.player.body.enable = false;
    if (enemy.body) enemy.body.enable = false;

    // クイズシーン開始
    this.scene.pause();
    this.scene.launch('QuizScene', {
      enemy: enemy,
      returnSceneKey: this.scene.key
    });
  };

  handleQuizResult = (isCorrect: boolean) => {
    // クイズ結果処理
    if (isCorrect) {
      // 正解の場合、敵を削除
      if (this.currentEnemy && this.currentEnemy.active) {
        this.currentEnemy.destroy();
      }
    } else {
      // 不正解の場合、HPを減らして無敵時間を設定
      this.player.damage(1);
      this.player.startInvincibility(3000);

      if (this.player.health <= 0) {
        this.scene.stop();
        this.scene.start('GameOverScene');
        return;
      }

      // 敵のbodyを再有効化（再衝突可能にする）
      if (this.currentEnemy && this.currentEnemy.body) {
        this.currentEnemy.body.enable = true;
      }
    }

    // プレイヤーのbodyを再有効化
    if (this.player.body) {
      this.player.body.enable = true;
    }

    // シーンを再開
    this.scene.resume();

    // 現在の敵をクリア
    this.currentEnemy = undefined;
  };
}
