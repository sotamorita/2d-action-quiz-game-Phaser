import Phaser from 'phaser';
import { UIConstants } from '../styles/UIConstants';

/**
 * @class CommonBackground
 * @description
 * 複数のシーンで共通して利用される背景描画と更新処理をまとめたクラスです。
 * インスタンスとして生成し、各シーンの`create`で描画、`update`で更新を行います。
 *
 * [設計思想]
 * - **コンポーネント化**: 背景というUIパーツを一つのクラスにカプセル化しています。
 *   これにより、背景に関するロジック（描画、スクロールなど）が一箇所にまとまり、
 *   各シーンは背景の具体的な実装を意識することなく利用できます。
 * - **状態の保持**: スクロール位置などの状態をクラスのプロパティとして保持するため、
 *   静的クラスからインスタンス化して使用する設計に変更しました。
 * - **責務の分離**: このクラスは「背景の管理」という単一の責務に特化しています。
 *   シーンクラスは、このクラスのインスタンスを生成し、`create`と`update`で
 *   適切なメソッドを呼び出すだけで背景の描画と更新を行えます。
 */
export class CommonBackground {
  private scene: Phaser.Scene;
  private background!: Phaser.GameObjects.TileSprite;

  /**
   * @param scene - この背景コンポーネントが所属するPhaserシーン。
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 背景を描画します。オプションで地面も描画できます。
   * Registryに保存されたスクロール位置があれば、その位置から描画を開始します。
   * @param withGround - 地面を描画するかどうかのフラグ。デフォルトは`false`。
   */
  create(withGround: boolean = false): void {
    const bg = UIConstants.Background;
    this.background = this.scene.add.tileSprite(
      bg.TileSpriteX,
      bg.TileSpriteY,
      bg.TileSpriteWidth,
      bg.TileSpriteHeight,
      'background'
    );
    this.background.setOrigin(0, 0);

    // Registryからスクロール位置を読み込んで適用
    const savedScrollX = this.scene.registry.get('backgroundScrollX');
    if (typeof savedScrollX === 'number') {
      this.background.tilePositionX = savedScrollX;
    }

    if (withGround) {
      this.drawGround();
    }
  }

  /**
   * 背景をゆっくりとスクロールさせ、現在のスクロール位置をRegistryに保存します。
   * このメソッドは、シーンの`update`ループから毎フレーム呼び出されることを想定しています。
   */
  update(): void {
    if (this.background) {
      this.background.tilePositionX += 0.1; // スクロール速度
      // 現在のスクロール位置をRegistryに保存
      this.scene.registry.set('backgroundScrollX', this.background.tilePositionX);
    }
  }

  /**
   * GameSceneと一貫性のある地面を描画します。
   * @private
   */
  private drawGround(): void {
    const bg = UIConstants.Background;
    for (let x = 200; x <= 1400; x += 400) {
      this.scene.add.image(x, bg.GroundY, 'ground').setScale(2);
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
