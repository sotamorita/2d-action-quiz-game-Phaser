import Phaser from 'phaser';
import TitleScene from './scenes/TitleScene';
import StageSelectScene from './scenes/StageSelectScene';
import GameScene from './scenes/GameScene';
import QuizScene from './scenes/QuizScene';
import ClearScene from './scenes/ClearScene';
import GameOverScene from './scenes/GameOverScene';
import PauseOverlayScene from './scenes/PauseOverlayScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 640,
  height: 400,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [TitleScene, StageSelectScene, GameScene, QuizScene, ClearScene, GameOverScene, PauseOverlayScene]
};


new Phaser.Game(config);
