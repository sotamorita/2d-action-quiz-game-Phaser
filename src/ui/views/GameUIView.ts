import Phaser from 'phaser';
import { RetroUI } from '../styles/RetroUI';
import Player from '../../features/player/Player';

/**
 * ゲーム内のUI要素を管理するクラス
 */
export default class GameUIView {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;

  private score = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * UI要素を作成する
   */
  public create(player: Player): void {
    this.scoreText = RetroUI.createSimpleText(this.scene, 16, 16, 'Score: 0', {
      fontSize: '16px'
    }).setScrollFactor(0);

    this.hpText = RetroUI.createSimpleText(this.scene, 16, 32, `HP: ${player.health}`, {
      fontSize: '16px'
    }).setScrollFactor(0);

    // 操作説明の追加
    RetroUI.createSimpleText(this.scene, 16, 305, '[矢印キー] 移動  [Space] ジャンプ  [Esc] ポーズ', {
      fontSize: '12px'
    }).setScrollFactor(0);
  }

  /**
   * スコアを更新する
   */
  public updateScore(amount: number): void {
    this.score += amount;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  /**
   * HP表示を更新する
   */
  public updateHp(health: number): void {
    this.hpText.setText(`HP: ${health}`);
  }

  /**
   * 現在のスコアを取得する
   */
  public getScore(): number {
    return this.score;
  }
}
