import Phaser from 'phaser';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/styles/UIConstants';
import { CommonBackground } from '../ui/views/CommonBackground';

/**
 * @class TitleScene
 * @extends Phaser.Scene
 * @description
 * ゲームのタイトル画面を表示するシーン。
 * プレイヤーはここからゲームを開始したり、他のモードへ遷移したりします。
 *
 * 設計思想:
 * このシーンは、ユーザーをゲームの世界に迎え入れる「玄関」の役割を果たします。
 * - **UIコンポーネントの再利用**: `Menu`クラスという再利用可能なコンポーネントを
 *   利用して、メニューを構築しています。これにより、TitleScene自体はメニューの
 *   具体的な実装（ボタンの配置やハイライト処理など）を知る必要がなく、
 *   「どんな選択肢があるか」と「選択されたときに何をするか」だけを定義すればよくなります。
 * - **視覚的な演出**: Tweenアニメーションを使ってタイトルテキストを動かすことで、
 *   静的な画面に「生命感」を与え、プレイヤーの興味を引きつけます。
 */
export default class TitleScene extends Phaser.Scene {
  private menu!: Menu; // メニューコンポーネント
  private commonBackground!: CommonBackground;

  constructor() {
    super('TitleScene');
  }

  /**
   * シーンが生成されるときに呼び出されるメソッド。
   * タイトル画面の要素をすべて作成・配置します。
   */
  create() {
    // カメラを500ミリ秒かけてフェードインさせる演出
    this.cameras.main.fadeIn(500, 0, 0, 0);

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 共通背景を作成
    this.commonBackground = new CommonBackground(this);
    this.commonBackground.create();

    // 背景の上に半透明の黒いオーバーレイを重ねて、テキストを読みやすくする
    this.add.rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      UIConstants.Overlay.BgColor,
      0.4 // Alpha値を少し下げて、背景がうっすら見えるように調整
    );

    // タイトルテキストを作成
    const titleText = this.add.text(centerX, centerY - 50, '2Dアクション・クイズゲーム', {
      fontFamily: UIConstants.FontFamily,
      fontSize: '38px',
      color: UIConstants.Color.White,
    }).setOrigin(0.5).setShadow(3, 3, UIConstants.Color.Black, 3); // テキストの中心を基準に配置

    // タイトルテキストをゆっくり上下に動かすTweenアニメーション
    this.tweens.add({
      targets: titleText,
      y: titleText.y + 5, // 5ピクセル下に動かす
      duration: 3000,      // 3秒かける
      ease: 'Sine.easeInOut', // 滑らかな動き
      yoyo: true,          // trueにすると元の位置に自動で戻る
      repeat: -1           // 無限に繰り返す
    });

    // メニューコンポーネントを生成
    this.menu = new Menu(this, {
      x: centerX,
      y: centerY + 40,
      options: ['ゲームスタート', 'クイズ選択'],
      startY: 0,
      highlightColor: UIConstants.Color.Green,
      highlightTextColor: UIConstants.Color.Black,
      // タイトルシーンのメニュー項目にのみ適用する特別なスタイル
      overrideStyles: {
        0: { // 「ゲームスタート」
          fontSize: '24px', // 少し大きく
        },
        1: { // 「クイズ選択」
          fontSize: '24px', // 少し大きく
        }
      }
    });

    // メニュー項目が選択されたときのイベントリスナー
    this.menu.on('selected', (index: number) => {
      if (index === 0) {
        // 「ゲームスタート」が選択されたら、ステージ選択シーンへ
        this.scene.start('StageSelectScene');
      } else if (index === 1) {
        // 「クイズ選択」が選択されたら、クイズカテゴリ選択シーンへ
        this.scene.start('QuizCategorySelectScene');
      }
    });
  }

  /**
   * シーンの更新処理。毎フレーム呼び出されます。
   * 背景をスクロールさせます。
   */
  update() {
    this.commonBackground.update();
  }
}
