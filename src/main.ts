import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import QuizScene from './scenes/QuizScene';
import ClearScene from './scenes/ClearScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene, QuizScene, ClearScene]
};


new Phaser.Game(config);
