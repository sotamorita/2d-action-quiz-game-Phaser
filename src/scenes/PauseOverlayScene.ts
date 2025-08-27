import Phaser from 'phaser';
import { RetroUI } from '../ui/styles/RetroUI';
import Menu from '../ui/components/Menu';
import { SelectedQuizDisplay } from '../ui/components/SelectedQuizDisplay';
import { UIConstants } from '../ui/styles/UIConstants';

/**
 * @class PauseOverlayScene
 * @description
 * ゲームプレイ中（`GameScene`）にポーズした際に、上に重ねて表示されるモーダル的なシーンです。
 * ゲームの再開、リトライ、タイトルへの復帰といった選択肢をプレイヤーに提供します。
 *
 * [設計思想]
 * - **オーバーレイシーン**: このシーンは他のシーン（主に`GameScene`）を停止させずに、
 *   その上に重ねて（オーバーレイして）実行されます。`scene.launch()`で起動され、
 *   `scene.resume()`や`scene.stop()`を使って背後のシーンを制御します。
 *   これにより、ゲームの状態を保持したまま、モーダルUIを提供できます。
 * - **コンテキストの引き継ぎ**: `init`メソッドを通じて、呼び出し元のシーンからステージ情報
 *   （`stageId`, `mapPath`）を受け取ります。これにより、「リトライ」が選択された際に、
 *   同じステージで`GameScene`を再起動することが可能になります。
 * - **UIコンポーネントの活用**: 他のメニュー系シーンと同様に、`Menu`コンポーネントと`RetroUI`を
 *   活用して、一貫性のあるUIを効率的に構築しています。
 * - **明確なアクション定義**: `executeAction`メソッド内で、メニューの選択肢（インデックス）と
 *   実行するアクション（コンティニュー、リトライ、タイトルへ）を明確に対応付けています。
 *   これにより、ロジックが追いやすくなっています。
 */
export default class PauseOverlayScene extends Phaser.Scene {
  // GameSceneから引き継ぐ、現在のステージ情報
  private stageId?: string;
  private mapPath?: string;
  // ポーズをかけた元のシーンのキー
  private returnScene?: string;
  private menu!: Menu;

  // このシーン専用のショートカットキー
  private escKey?: Phaser.Input.Keyboard.Key;
  private rKey?: Phaser.Input.Keyboard.Key;
  private tKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('PauseOverlayScene');
  }

  /**
   * シーンが起動する際に呼び出され、呼び出し元のシーンからデータを受け取ります。
   * @param data - 呼び出し元シーンから渡されるデータオブジェクト。
   * @param data.stageId - 現在のステージID。リトライ時に使用。
   * @param data.mapPath - 現在のマップファイルパス。リトライ時に使用。
   * @param data.returnScene - ポーズを解除した際に再開するシーンのキー。
   */
  init(data: { stageId?: string; mapPath?: string; returnScene?: string }) {
    this.stageId = data.stageId;
    this.mapPath = data.mapPath;
    this.returnScene = data.returnScene;
  }

  /**
   * シーンが開始されたときに一度だけ呼び出され、UI要素の作成とイベントリスナーの設定を行います。
   */
  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // レトロ風UIパネル作成
    const { panel } = RetroUI.createPanel(this, centerX, centerY, 400, 250);

    // タイトルテキスト
    RetroUI.createTitle(panel.scene, panel, 'ポーズ', -80);

    // メニュー作成
    this.menu = new Menu(this, {
      x: panel.x,                   // X座標
      y: panel.y,                   // Y座標
      options: ['コンティニュー', 'リトライ', 'タイトルへ戻る'],
      fontSize: UIConstants.FontSize.Large, // フォントサイズ
      startY: -20,                  // 開始Y座標（コンテナ中心からのオフセット）
      spacing: 35,                  // 各項目の間隔
    });

    // メニュー選択時のイベントリスナー
    this.menu.on('selected', (index: number) => {
      this.executeAction(index);
    });

    // ショートカットキー設定
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    this.escKey.on('down', () => this.executeAction(0));
    this.rKey.on('down', () => this.executeAction(1));
    this.tKey.on('down', () => this.executeAction(2));

    // 操作説明
    const instructionText = '↑/↓: 選択  Enter: 決定\nESC: コンティニュー  R: リトライ  T: タイトル';
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      instructionText,
      90, // Y座標
      { lineSpacing: 10 } // 行間
    );

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);

    // 現在選択中のクイズカテゴリを表示
    const selectedQuizDisplay = new SelectedQuizDisplay(this);
    // 画面右下に配置
    selectedQuizDisplay.setPosition(this.cameras.main.width - 15, this.cameras.main.height - 10, 1, 1);
  }

  /**
   * メニューで選択された項目に応じたアクションを実行します。
   * @param actionIndex - 選択されたメニュー項目のインデックス。
   * @private
   */
  private executeAction(actionIndex: number) {
    const returnSceneKey = this.returnScene || 'GameScene';

    switch (actionIndex) {
      // コンティニュー
      case 0:
        this.scene.resume(returnSceneKey);
        this.scene.stop(); // このポーズシーン自身を停止
        break;
      // リトライ
      case 1:
        this.scene.stop(returnSceneKey); // 現在のゲームシーンを完全に停止
        // 新しいゲームシーンを同じステージ情報で開始
        this.scene.start('GameScene', {
          stageId: this.stageId,
          mapPath: this.mapPath
        });
        break;
      // タイトルへ戻る
      case 2:
        this.scene.stop(returnSceneKey); // 現在のゲームシーンを完全に停止
        this.scene.start('TitleScene');
        break;
    }
  }

  /**
   * このシーンで登録したすべてのイベントリスナーを解除します。
   * シーンがシャットダウンする際に自動的に呼び出され、メモリリークを防ぎます。
   * @private
   */
  private cleanup() {
    // ショートカットキーのイベントを解除
    this.escKey?.off('down');
    this.rKey?.off('down');
    this.tKey?.off('down');
    // Menuオブジェクトは自身のdestroyメソッドでイベントを解除するので、ここでは不要
  }
}
