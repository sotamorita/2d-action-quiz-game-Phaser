import Phaser from 'phaser';

/**
 * @class BootScene
 * @extends Phaser.Scene
 * @description
 * ゲーム起動時に最初に読み込まれるシーン。
 * このシーンの唯一の役割は、次の`PreloadScene`を開始することです。
 *
 * 設計思想:
 * ゲームの起動プロセスを段階的に分割しています。
 * - BootScene: ゲームの入り口。基本的な設定や、次のシーンへの橋渡しを行う。
 * - PreloadScene: アセットの読み込みに専念する。
 * - TitleScene: ユーザーが最初に目にするゲーム画面。
 * このように役割を分けることで、各シーンの責務が明確になり、管理しやすくなります。
 * 例えば、将来的に起動時の設定（スケールモードの変更など）を追加する場合、
 * この`BootScene`に記述すれば良いため、他のシーンに影響を与えません。
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  /**
   * デフォルト設定に必要なアセットを読み込みます。
   */
  preload() {
    // デフォルトのクイズカテゴリを設定するために、カテゴリ情報を読み込みます。
    this.load.json('quiz_categories', 'assets/quiz/categories.json');
  }

  /**
   * シーンが生成されるときに呼び出されるメソッド。
   * デフォルトのクイズカテゴリを設定し、次のシーンへ移行します。
   */
  create() {
    // まだクイズカテゴリが選択されていない場合のみ、デフォルト値を設定
    if (!this.registry.has('selectedQuizCategories')) {
      const categoryData = this.cache.json.get('quiz_categories');
      const allCategories = categoryData.categories.map((c: { id: string; filePath: string }) => ({
        id: c.id,
        filePath: c.filePath,
      }));
      this.registry.set('selectedQuizCategories', allCategories);
      console.log('Default quiz categories set:', allCategories);
    }

    // アセットの読み込みを担当する`PreloadScene`に速やかに移行します。
    this.scene.start('PreloadScene');
  }
}
