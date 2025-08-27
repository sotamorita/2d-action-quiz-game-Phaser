import Phaser from 'phaser';
import { UIConstants } from '../styles/UIConstants';

/**
 * @class SelectedQuizDisplay
 * @description
 * 現在選択されているクイズカテゴリを表示するためのUIコンポーネント。
 * Registryからカテゴリ情報を読み取り、画面の指定された位置に表示します。
 *
 * [設計思想]
 * - **再利用性**: 特定のシーンに依存せず、どのシーンからでも呼び出せるように設計されています。
 *   `Phaser.Scene`のインスタンスをコンストラクタで受け取ることで、必要な機能（Registry、Add factoryなど）にアクセスします。
 * - **単一責務**: このクラスの責務は「選択中カテゴリの表示」のみです。
 *   データの取得、整形、描画以外のロジックは含みません。
 * - **データ駆動**: 表示内容は`Registry`の`selectedQuizCategories`キーに完全に依存します。
 *   Registryの値が変更されれば、再生成することで表示に反映できます（現状はシーン遷移時に再生成）。
 * - **柔軟な配置**: `create`メソッドで座標と原点を指定できるようにし、
 *   呼び出し元シーンのレイアウトに合わせて柔軟に配置できるようにしています。
 */
export class SelectedQuizDisplay extends Phaser.GameObjects.Container {
  private textObject: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene);
    this.scene = scene;

    this.textObject = this.scene.add.text(0, 0, '', {
      fontFamily: UIConstants.FontFamily,
      fontSize: UIConstants.FontSize.Small,
      color: UIConstants.Color.White,
      stroke: UIConstants.Color.Black,
      strokeThickness: 4,
      align: 'right',
    });

    this.add(this.textObject);
    this.scene.add.existing(this);

    this.updateText();
  }

  /**
   * Registryから最新のカテゴリ情報を取得し、表示テキストを更新します。
   */
  private updateText(): void {
    const selectedCategories = this.scene.registry.get('selectedQuizCategories') || [];
    const allCategoriesData = this.scene.cache.json.get('quiz_categories');

    if (!allCategoriesData) {
      this.textObject.setText('クイズ: 情報読込中...');
      return;
    }

    const allCategories = allCategoriesData.categories;
    let displayText = 'クイズ: ';

    if (selectedCategories.length >= allCategories.length) {
      displayText += 'すべての問題';
    } else if (selectedCategories.length > 1) {
      displayText += '複数選択';
    } else if (selectedCategories.length === 1) {
      const selectedId = selectedCategories[0].id;
      const category = allCategories.find((c: { id: string }) => c.id === selectedId);
      displayText += category ? category.name : '不明なカテゴリ';
    } else {
      displayText += '未選択';
    }

    this.textObject.setText(displayText);
  }

  /**
   * 指定された位置にコンポーネントを配置します。
   * @param x - X座標
   * @param y - Y座標
   * @param originX - X方向の原点 (0-1)
   * @param originY - Y方向の原点 (0-1)
   */
  public setPosition(x: number, y: number, originX: number = 0.5, originY: number = 0.5): this {
    super.setPosition(x, y);
    // textObjectが初期化済みの場合のみsetOriginを呼び出す
    if (this.textObject) {
      this.textObject.setOrigin(originX, originY);
    }
    return this;
  }
}
