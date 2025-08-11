import Phaser from 'phaser';
import TitleScene from './scenes/TitleScene';
import StageSelectScene from './scenes/StageSelectScene';
import GameScene from './scenes/GameScene';
import QuizScene from './scenes/QuizScene';
import ClearScene from './scenes/ClearScene';
import GameOverScene from './scenes/GameOverScene';
import PauseOverlayScene from './scenes/PauseOverlayScene';
import QuizCategorySelectScene from './scenes/QuizCategorySelectScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 640,
  height: 320,
  parent: 'game-container', // ゲームキャンバスを配置する要素のID
  scale: {
    mode: Phaser.Scale.FIT, // アスペクト比を維持しながらフィット
    autoCenter: Phaser.Scale.CENTER_BOTH, // 中央配置
    width: 640,
    height: 320,
    max: {
      width: 640,
      height: 320
    }
  },
  render: {
    pixelArt: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [TitleScene, StageSelectScene, GameScene, QuizScene, ClearScene, GameOverScene, PauseOverlayScene, QuizCategorySelectScene]
};

const game = new Phaser.Game(config);

// ゲームが初期化された後にスタイルを動的に適用
game.events.once('ready', () => {
  // Registryにグローバルな初期値を設定
  game.registry.set('selectedQuizCategory', 'general');

  // bodyの背景色を設定（装飾は削除してシンプルに）
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.backgroundColor = '#242424'; // ダークグレーの背景
  document.body.style.width = '100%';
  document.body.style.height = '100vh';
  document.body.style.display = 'flex';
  document.body.style.justifyContent = 'center';
  document.body.style.alignItems = 'center';
  document.body.style.overflow = 'hidden';
});
