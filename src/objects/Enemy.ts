import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  speed: number;
  health: number;
  damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number, properties: Record<string, any> = {}) {
    super(scene, x, y, 'enemy');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setCollideWorldBounds(true);

    this.speed = properties.speed ?? 100;
    this.health = properties.health ?? 3;
    this.damage = properties.damage ?? 1;
  }
}
