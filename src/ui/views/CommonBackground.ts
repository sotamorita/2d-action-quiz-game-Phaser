import Phaser from 'phaser';
import { UIConstants } from '../styles/UIConstants';

/**
 * @class CommonBackground
 * @description
 * 複数のシーンで共通して利用される背景描画関連の処理をまとめた静的ユーティリティクラスです。
 * 主にタイトル画面やステージ選択画面など、ゲームプレイ画面（GameScene）と
 * 同じ世界観を共有するシーンで使用されます。
 *
 * [設計思想]
 * - **共通処理の集約**: 背景や地面のアセット読み込みと描画ロジックは、多くのシーンで重複します。
 *   これらの処理を静的メソッドとしてこのクラスに集約することで、コードの重複を排除し、
 *   保守性を向上させています。例えば、背景画像を変更したい場合、このクラスの関連箇所を
 *   修正するだけで、すべての利用シーンに一括で反映できます。
 * - **責務の分離**: このクラスは「背景の描画」という単一の責務に特化しています。
 *   各シーンクラスは、このクラスのメソッドを呼び出すだけで背景描画を完了でき、
 *   自身の本来の責務（例: タイトルメニューの管理）に集中できます。
 */
export class CommonBackground {
  /**
   * ゲームのメインステージ（GameScene）と一貫性のある背景および地面を描画します。
   * `UIConstants`で定義されたレイアウト情報に基づいて、背景のタイル状スプライトと
   * 地面のプラットフォーム画像をシーンに追加します。
   * @param scene - 背景を描画する対象のPhaserシーン。
   */
  static drawGameBackground(scene: Phaser.Scene): void {
    // 背景描画
    const bg = UIConstants.Background;
    const background = scene.add.tileSprite(bg.TileSpriteX, bg.TileSpriteY, bg.TileSpriteWidth, bg.TileSpriteHeight, 'background');
    background.setOrigin(0, 0);

    // 地面描画（GameSceneと同じ配置）
    for (let x = 200; x <= 1400; x += 400) {
      scene.add.image(x, bg.GroundY, 'ground').setScale(2);
    }
  }

  /**
   * 背景および地面の描画に必要な画像アセットをプリロード（事前読み込み）します。
   * このメソッドは、通常、`PreloadScene`や、動的にアセットを読み込む必要のあるシーンの
   * `preload`メソッド内から呼び出されます。
   * @param scene - アセットをロードするためのPhaserシーン。
   */
  static preloadBackgroundAssets(scene: Phaser.Scene): void {
    scene.load.image('background', 'assets/maps/background.png');
    scene.load.image('ground', 'assets/platform.png');
  }
}
