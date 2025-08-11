import Phaser from 'phaser';
import { RetroUI } from '../styles/RetroUI';
import Player from '../../features/player/Player';

/**
 * @class GameUIView
 * @description
 * ゲームプレイシーン（GameScene）で表示されるUI要素（スコア、HPなど）の
 * 生成と更新を専門に担当するクラス。
 *
 * 設計思想:
 * このクラスは、UIの表示ロジックをゲームのメインロジック（GameScene）から分離する
 * 「ビュー」の役割を担います。
 * - `GameScene`: ゲームのルールやオブジェクトの振る舞いを管理する。
 * - `GameUIView`: ゲームの状態（スコア、HP）を画面に表示することに専念する。
 * このように責務を分離することで、コードの見通しが良くなり、
 * UIのデザイン変更がゲームロジックに影響を与えにくくなります。
 */
export default class GameUIView {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text; // スコア表示用テキスト
  private hpText!: Phaser.GameObjects.Text; // HP表示用テキスト

  private score = 0; // 現在のスコア

  /**
   * GameUIViewのインスタンスを生成します。
   * @param {Phaser.Scene} scene - このUIが属するシーン。
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * UI要素を生成し、画面に配置します。
   * @param {Player} player - HP表示の初期値を取得するためのプレイヤーオブジェクト。
   */
  public create(player: Player): void {
    // スコアテキストを生成
    this.scoreText = RetroUI.createSimpleText(this.scene, 16, 16, 'Score: 0', {
      fontSize: '16px'
    }).setScrollFactor(0); // カメラが移動してもUIは画面に固定されるように設定

    // HPテキストを生成
    this.hpText = RetroUI.createSimpleText(this.scene, 16, 32, `HP: ${player.health}`, {
      fontSize: '16px'
    }).setScrollFactor(0);

    // 操作説明テキストを生成
    RetroUI.createSimpleText(this.scene, 16, 305, '[矢印キー] 移動  [Space] ジャンプ  [Esc] ポーズ', {
      fontSize: '12px'
    }).setScrollFactor(0);
  }

  /**
   * スコアを加算し、表示を更新します。
   * @param {number} amount - 加算するスコア量。
   */
  public updateScore(amount: number): void {
    this.score += amount;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  /**
   * HPの表示を更新します。
   * @param {number} health - 更新後のHP。
   */
  public updateHp(health: number): void {
    this.hpText.setText(`HP: ${health}`);
  }

  /**
   * 現在のスコアを取得します。
   * @returns {number} 現在のスコア。
   */
  public getScore(): number {
    return this.score;
  }
}
