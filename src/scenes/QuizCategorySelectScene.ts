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
  private commonBackground!: CommonBackground;
  private escKey?: Phaser.Input.Keyboard.Key;
  private quizCategories: { id: string; name: string; filePath?: string }[] = [];

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
    this.load.json('quiz_categories', 'assets/quiz/categories.json');
  }

  /**
   * シーンが開始されたときに一度だけ呼び出され、UI要素の作成とイベントリスナーの設定を行います。
   */
  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 共通の背景を描画
    this.commonBackground = new CommonBackground(this);
    this.commonBackground.create(true); // 地面も描画

    // カテゴリデータを読み込み、「すべての問題」を追加
    const categoryData = this.cache.json.get('quiz_categories');
    this.quizCategories = [
      { id: 'all', name: 'すべての問題' },
      ...categoryData.categories,
    ];

    // UIユーティリティを使って、中央に表示されるパネルを作成
    const panelHeight = Math.min(this.cameras.main.height * 0.8, 350);
    const { panel } = RetroUI.createPanel(this, centerX, centerY, 400, panelHeight);

    // パネル内にタイトルテキストを配置
    const title = RetroUI.createTitle(panel.scene, panel, 'クイズ選択', -(panelHeight / 2) + 40);

    // --- スクロール可能なメニューの実装 ---
    const menuAreaY = panel.y - panelHeight / 2 + 80; // タイトルの下から (位置を少し下げる)
    const menuAreaHeight = panelHeight - 120; // 高さを調整

    const menuContainer = this.add.container(panel.x, menuAreaY);

    const menuOptions = this.quizCategories.map(c => c.name);
    this.menu = new Menu(this, {
      x: 0,
      y: 0,
      options: menuOptions,
      fontSize: UIConstants.FontSize.Normal,
      startY: 15, // 最初の項目の開始位置を下げて、見切れを防ぐ
      spacing: 28, // 行間を調整
    });
    menuContainer.add(this.menu);

    // マスクを作成
    const maskGraphics = this.make.graphics({});
    maskGraphics.fillRect(panel.x - 190, menuAreaY, 380, menuAreaHeight);
    menuContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, maskGraphics));

    // スクロール範囲の計算
    const menuHeight = this.menu.getBounds().height;
    const maxScrollY = menuAreaY;
    // 最後の項目がハイライトされても見切れないように、少し余白(padding)を追加
    const bottomPadding = 10;
    const minScrollY = Math.min(maxScrollY, menuAreaY + menuAreaHeight - menuHeight - bottomPadding);

    // マウスホイールでスクロール
    this.input.on('wheel', (pointer: Phaser.Input.Pointer) => {
      const bounds = new Phaser.Geom.Rectangle(panel.x - 190, menuAreaY, 380, menuAreaHeight);
      if (bounds.contains(pointer.x, pointer.y)) {
        menuContainer.y -= pointer.deltaY * 0.5;
        menuContainer.y = Phaser.Math.Clamp(menuContainer.y, minScrollY, maxScrollY);
      }
    });

    // Menuコンポーネントが'selected'イベントを発行したら、selectCategoryメソッドを呼び出す
    this.menu.on('selected', (index: number) => {
      this.selectCategory(index);
    });

    // 矢印キーでの選択変更時に自動スクロールする処理
    this.menu.on('selectionChanged', (item: { index: number; y: number; height: number }) => {
      // 最初の項目が選択されたら、必ず初期位置（maxScrollY）に戻す
      if (item.index === 0) {
        menuContainer.y = maxScrollY;
        return;
      }

      const itemAbsoluteY = menuContainer.y + item.y;
      const viewTop = menuAreaY;
      const viewBottom = menuAreaY + menuAreaHeight;

      if (itemAbsoluteY - item.height / 2 < viewTop) {
        // 上にはみ出た場合
        menuContainer.y = viewTop - item.y + item.height / 2;
      } else if (itemAbsoluteY + item.height / 2 > viewBottom) {
        // 下にはみ出た場合
        menuContainer.y = viewBottom - item.y - item.height / 2;
      }
      // スクロール範囲内に収める
      menuContainer.y = Phaser.Math.Clamp(menuContainer.y, minScrollY, maxScrollY);
    });

    // パネル内に操作説明テキストを配置
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      'Enter: 決定  Esc: タイトルに戻る',
      panelHeight / 2 - 30,
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

    const selectedOption = this.quizCategories[index];
    let categoriesToLoad = [];

    if (selectedOption.id === 'all') {
      // 「すべての問題」が選択された場合、'all'以外の全カテゴリを対象とする
      categoriesToLoad = this.quizCategories
        .filter(c => c.id !== 'all')
        .map(c => ({ id: c.id, filePath: c.filePath }));
    } else {
      // 特定のカテゴリが選択された場合
      categoriesToLoad = [{
        id: selectedOption.id,
        filePath: selectedOption.filePath,
      }];
    }

    // 選択したカテゴリ情報を、ゲーム全体で共有されるRegistryに保存
    this.registry.set('selectedQuizCategories', categoriesToLoad);
    console.log(`Set quiz categories to:`, categoriesToLoad);

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
