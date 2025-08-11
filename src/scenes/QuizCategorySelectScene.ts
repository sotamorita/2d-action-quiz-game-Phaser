import Phaser from 'phaser';
import { RetroUI } from '../ui/styles/RetroUI';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/styles/UIConstants';
import { CommonBackground } from '../ui/views/CommonBackground';

/**
 * @class QuizCategorySelectScene
 * @description
 * ゲームで出題されるクイズのカテゴリを選択するシーンです。
 * ここで選択されたカテゴリはPhaserのRegistryに保存され、`QuizScene`で読み込まれます。
 *
 * [設計思想]
 * - **設定の永続化 (Registry)**: 選択したカテゴリ情報をシーン間で引き継ぐために、
 *   Phaserのグローバルな状態管理機能である`this.registry`を使用しています。
 *   これにより、シーンをまたいでも設定が保持され、`QuizScene`はRegistryを参照するだけで
 *   どのカテゴリの問題をロードすればよいかを知ることができます。
 * - **UIコンポーネントの再利用**: `StageSelectScene`と同様に、`Menu`コンポーネントや
 *   `RetroUI`ユーティリティを再利用することで、UIの一貫性を保ちつつ、
 *   効率的にシーンを構築しています。
 * - **データ駆動**: `quizCategories`配列で選択肢を管理しています。将来的には、
 *   `quiz_db.json`を解析して動的にカテゴリ一覧を生成するよう拡張することを想定しています。
 *   これにより、JSONファイルに新しいカテゴリを追加するだけで、自動的に選択肢に反映されるようになります。
 */
export default class QuizCategorySelectScene extends Phaser.Scene {
  private menu!: Menu;
  private escKey?: Phaser.Input.Keyboard.Key;
  // 将来的にquiz_db.jsonから動的にカテゴリを取得することを想定したデータ構造
  private quizCategories = [{ id: 'general', name: 'すべての問題' }];

  constructor() {
    super({ key: 'QuizCategorySelectScene' });
  }

  /**
   * シーンで使用するアセットを読み込みます。
   */
  preload() {
    // このシーンに直接遷移した場合にも背景が表示されるよう、念のため読み込み処理を入れています。
    if (!this.textures.exists('background')) {
      CommonBackground.preloadBackgroundAssets(this);
    }
  }

  /**
   * シーンが開始されたときに一度だけ呼び出され、UI要素の作成とイベントリスナーの設定を行います。
   */
  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 共通の背景を描画
    CommonBackground.drawGameBackground(this);

    // UIユーティリティを使って、中央に表示されるパネルを作成
    const { panel } = RetroUI.createPanel(this, centerX, centerY, 400, 250);

    // パネル内にタイトルテキストを配置
    RetroUI.createTitle(panel.scene, panel, 'クイズ選択', -60);

    // Menuコンポーネントを使ってカテゴリ選択肢を作成
    this.menu = new Menu(this, {
      x: panel.x,
      y: panel.y,
      options: this.quizCategories.map(c => c.name),
      fontSize: UIConstants.FontSize.Large,
      startY: 0,
    });

    // Menuコンポーネントが'selected'イベントを発行したら、selectCategoryメソッドを呼び出す
    this.menu.on('selected', (index: number) => {
      this.selectCategory(index);
    });

    // パネル内に操作説明テキストを配置
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      'Enter: 決定  Esc: タイトルに戻る',
      100,
      { lineSpacing: 10 }
    );

    // Escキーでタイトルシーンに戻るイベントを設定
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.scene.start('TitleScene'));

    // シーンが終了する際に、登録したイベントリスナーをクリーンアップする
    this.events.once('shutdown', this.cleanup, this);
  }

  /**
   * 指定されたインデックスのカテゴリを選択し、そのIDをRegistryに保存してからタイトルシーンに戻ります。
   * @param index - `this.quizCategories`配列内のカテゴリのインデックス。
   * @private
   */
  private selectCategory(index: number) {
    if (index < 0 || index >= this.quizCategories.length) return;
    const selectedCategory = this.quizCategories[index];

    // 選択したカテゴリIDを、ゲーム全体で共有されるRegistryに保存
    this.registry.set('selectedQuizCategory', selectedCategory.id);
    console.log(`Set quiz category to: ${selectedCategory.id}`);

    // 設定が完了したら、タイトルシーンに戻る
    this.scene.start('TitleScene');
  }

  /**
   * このシーンで登録したすべてのイベントリスナーを解除します。
   * シーンがシャットダウンする際に自動的に呼び出され、メモリリークを防ぎます。
   * @private
   */
  private cleanup() {
    this.escKey?.off('down');
  }
}
