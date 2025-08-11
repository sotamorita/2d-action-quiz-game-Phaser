import Phaser from 'phaser';
import { RetroUI } from '../ui/styles/RetroUI';
import Menu from '../ui/components/Menu';
import { UIConstants } from '../ui/styles/UIConstants';
import { CommonBackground } from '../ui/views/CommonBackground';

/**
 * @class StageSelectScene
 * @description
 * プレイヤーがプレイするステージを選択するシーンです。
 * タイトルシーンから遷移し、選択されたステージの情報を`GameScene`に渡してゲームを開始します。
 *
 * [設計思想]
 * - **UIコンポーネントの活用**: ステージ選択のインターフェースには、再利用可能な`Menu`コンポーネントと
 *   `RetroUI`ユーティリティを使用しています。これにより、他のシーン（例: `TitleScene`）と
 *   一貫性のあるUIを効率的に構築しています。
 * - **データ駆動**: `stages`配列にステージの定義（ID, 表示名, マップファイルへのパス）を
 *   まとめておくことで、将来的にステージを追加する際に、この配列に新しいオブジェクトを
 *   追加するだけで、自動的に選択肢が増えるように設計されています。
 * - **関心の分離**: シーンの責務を明確にしています。このシーンは「ステージを選択し、
 *   次のシーンに情報を渡す」ことだけに集中し、実際のゲームプレイは`GameScene`に完全に委譲しています。
 * - **クリーンアップ処理**: `shutdown`イベントをリッスンし、シーンが終了する際に
 *   登録したキーボードイベントを確実に解除しています。これにより、他のシーンに影響を
 *   与えることなく、安全なシーン遷移を実現しています。
 */
export default class StageSelectScene extends Phaser.Scene {
  // 将来的なステージ追加を容易にするためのステージ定義配列
  private stages = [{ id: 'level1', name: 'レベル１', mapPath: 'assets/maps/level1.json' }];
  private menu!: Menu;

  // このシーン専用のショートカットキー
  private escKey?: Phaser.Input.Keyboard.Key;
  private oneKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('StageSelectScene');
  }

  /**
   * シーンで使用するアセットを読み込みます。
   * `CommonBackground`ユーティリティを使い、他のシーンと共通の背景アセットを読み込みます。
   */
  preload() {
    CommonBackground.preloadBackgroundAssets(this);
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 共通の背景を描画
    CommonBackground.drawGameBackground(this);

    // UIユーティリティを使って、中央に表示されるパネルを作成
    const { panel } = RetroUI.createPanel(this, centerX, centerY, 400, 250);

    // パネル内にタイトルテキストを配置
    RetroUI.createTitle(panel.scene, panel, 'ステージセレクト', -60);

    // メニュー作成
    this.menu = new Menu(this, {
      x: panel.x,                   // X座標
      y: panel.y,                   // Y座標
      options: this.stages.map(s => s.name),
      fontSize: UIConstants.FontSize.Large, // フォントサイズ
      startY: 0,                    // 開始Y座標（コンテナ中心からのオフセット）
    });

    // Menuコンポーネントが'selected'イベントを発行したら、selectStageメソッドを呼び出す
    this.menu.on('selected', (index: number) => {
      this.selectStage(index);
    });

    // パネル内に操作説明テキストを配置
    const instructionText = '↑/↓: 移動\n1: 直接選択\nEnter: 決定\nEsc: タイトルに戻る';
    RetroUI.createInstructionText(
      panel.scene,
      panel,
      instructionText,
      70, // Y座標
      { lineSpacing: 8 } // 行間
    );

    // ショートカットキー設定
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.oneKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);

    // Escキーでタイトルシーンに戻る
    this.escKey.on('down', () => this.scene.start('TitleScene'));
    // 数字の1キーで最初のステージを直接選択する
    this.oneKey.on('down', () => this.selectStage(0));

    // シーンが終了する際に、登録したイベントリスナーをクリーンアップする
    this.events.once('shutdown', this.cleanup, this);
  }

  /**
   * 指定されたインデックスのステージを選択し、GameSceneに遷移します。
   * GameSceneには、選択されたステージのIDとマップファイルのパスをデータとして渡します。
   * @param index - `this.stages`配列内のステージのインデックス。
   * @private
   */
  private selectStage(index: number) {
    if (index < 0 || index >= this.stages.length) return;
    const selectedStage = this.stages[index];
    this.scene.start('GameScene', {
      stageId: selectedStage.id,
      mapPath: selectedStage.mapPath
    });
  }

  /**
   * このシーンで登録したすべてのイベントリスナーを解除します。
   * シーンがシャットダウンする際に自動的に呼び出され、メモリリークを防ぎます。
   * @private
   */
  private cleanup() {
    // ?. (オプショナルチェイニング) を使って、キーが未定義の場合でもエラーが発生しないようにする
    this.escKey?.off('down');
    this.oneKey?.off('down');
  }
}
