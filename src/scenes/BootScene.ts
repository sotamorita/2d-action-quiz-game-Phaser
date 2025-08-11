import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // PreloadSceneに移行
    this.scene.start('PreloadScene');
  }
}
