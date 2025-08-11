import Phaser from 'phaser';
import { RetroUI } from '../ui/styles/RetroUI';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/styles/UIConstants';

/**
 * @interface GameOverSceneData
 * @description GameOverSceneに渡すためのデータ構造を定義します。
 */
interface GameOverSceneData {
  stageId?: string; // プレイしていたステージのID
  mapPath?: string; // プレイしていたマップのパス
  score?: number;   // 最終スコア
}

/**
 * @class GameOverScene
 * @extends Phaser.Scene
 * @description
 * ゲームオーバー時に表示されるシーン。
 * 最終スコアを表示し、プレイヤーに「再挑戦」または「タイトルへ戻る」の選択肢を提供します。
 *
 * 設計思想:
 * このシーンは、ゲームの失敗という状態をユーザーに提示し、次の行動を促す役割を持ちます。
 * - **UIコンポーネントの活用**: `RetroUI`や`Menu`といった共通のUIコンポーネントを
 *   利用することで、他のシーン（TitleScene, ClearSceneなど）と一貫性のある
 *   デザインを保ちつつ、効率的に画面を構築しています。
 * - **関心の分離**: シーンの見た目（UI）とロジック（シーン遷移）が明確に分離されています。
 *   `create`メソッドでUIを構築し、`executeAction`メソッドで選択に応じた処理を実行します。
 * - **UXへの配慮**: マウスやキーボードだけでなく、ショートカットキー（R, T）でも
 *   操作できるようにし、プレイヤーの利便性を高めています。
 */
export default class GameOverScene extends Phaser.Scene {
  // --- プロパティ定義 ---
  private stageId!: string; // 再挑戦時に使用するステージID
  private mapPath!: string; // 再挑戦時に使用するマップパス
  private score!: number;   // 表示するスコア
  private menu!: Menu;      // メニューコンポーネント

  // ショートカットキー
  private rKey?: Phaser.Input.Keyboard.Key; // 'R'キー
  private tKey?: Phaser.Input.Keyboard.Key; // 'T'キー

  constructor() {
    super('GameOverScene');
  }

  /**
   * シーンの初期化処理。GameSceneなどからデータを受け取ります。
   * @param {GameOverSceneData} data - 初期化データ。
   */
  init(data: GameOverSceneData) {
    this.stageId = data.stageId ?? 'level1';
    this.mapPath = data.mapPath ?? 'assets/maps/level1.json';
    this.score = data.score ?? 0;
  }

  /**
   * シーンの生成処理。UI要素を作成し、イベントリスナーを設定します。
   */
  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 共通のレトロ風UIパネルを作成
    const { panel } = RetroUI.createPanel(this, centerX, centerY, 400, 250);

    // 「GAME OVER」タイトル
    const title = RetroUI.createTitle(panel.scene, panel, 'GAME OVER', -80);
    title.setColor(UIConstants.Color.Red); // ゲームオーバーなので赤色に
    title.setFontSize(UIConstants.FontSize.Title);

    // スコア表示
    const scoreText = this.add.text(0, -30, `SCORE: ${this.score}`, {
      fontSize: '28px',
      fontFamily: UIConstants.FontFamily,
      color: UIConstants.Color.Yellow
    }).setOrigin(0.5);
    panel.add(scoreText); // パネルの子要素として追加

    // メニューコンポーネントを作成
    this.menu = new Menu(this, {
      x: panel.x,
      y: panel.y,
      options: ['再挑戦', 'タイトルへ戻る'],
      fontSize: UIConstants.FontSize.Large,
      startY: 20,
      spacing: 35,
    });

    // メニュー選択時のイベントリスナー
    this.menu.on('selected', (index: number) => {
      this.executeAction(index);
    });

    // ショートカットキーを設定
    this.rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    this.rKey.on('down', () => this.executeAction(0)); // Rキーで「再挑戦」
    this.tKey.on('down', () => this.executeAction(1)); // Tキーで「タイトルへ」

    // 操作説明テキスト
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      '↑/↓: 選択  Enter: 決定\nR: 再挑戦  T: タイトル',
      95,
      {
        wordWrap: { width: 380 },
        lineSpacing: 7.5,
      }
    );

    // シーン終了時のクリーンアップ処理を登録
    this.events.once('shutdown', this.cleanup, this);
  }

  /**
   * メニューの選択に応じて、対応するアクション（シーン遷移）を実行します。
   * @param {number} actionIndex - 選択されたメニューのインデックス。
   */
  private executeAction(actionIndex: number) {
    switch (actionIndex) {
      case 0: // 再挑戦
        // 同じステージの情報を使ってGameSceneを再開
        this.scene.start('GameScene', {
          stageId: this.stageId,
          mapPath: this.mapPath
        });
        break;
      case 1: // タイトルへ戻る
        this.scene.start('TitleScene');
        break;
    }
  }

  /**
   * シーン終了時に呼び出されるクリーンアップ処理。
   * メモリリークを防ぐため、設定したキーボードイベントリスナーを解除します。
   */
  private cleanup() {
    this.rKey?.off('down');
    this.tKey?.off('down');
  }
}
