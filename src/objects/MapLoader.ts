import Phaser from 'phaser';
import Player from './Player';
import Enemy from './Enemy';
import Coin from './Coin';
import Key from './Key';
import Castle from './Castle';
import Heart from './Heart';

type GameObjectsResult = {
  player: Player | null;
  enemies: Enemy[];
  coins: Coin[];
  hearts: Heart[];
  keys: Key[];
  castles: Castle[];
};

export default class MapLoader {
  static load(scene: Phaser.Scene, tiledData: any, cursors: Phaser.Types.Input.Keyboard.CursorKeys): GameObjectsResult {
    const result: GameObjectsResult = {
      player: null,
      enemies: [],
      coins: [],
      hearts: [],
      keys: [],
      castles: []
    };

    if (!tiledData.layers) return result;

    tiledData.layers.forEach((layer: any) => {
      if (layer.type === 'objectgroup') {
        layer.objects.forEach((obj: any) => {
          const props = MapLoader.parseProperties(obj.properties);

          switch (obj.type) {
            case 'player':
              result.player = new Player(scene, obj.x, obj.y, cursors, props);
              break;
            case 'enemy':
              result.enemies.push(new Enemy(scene, obj.x, obj.y, props));
              break;
            case 'coin':
              result.coins.push(new Coin(scene, obj.x, obj.y, props));
              break;
            case 'key':
              result.keys.push(new Key(scene, obj.x, obj.y, props));
              break;
            case 'heart':
              result.hearts.push(new Heart(scene, obj.x, obj.y, props));
              break;
            case 'castle':
              result.castles.push(new Castle(scene, obj.x, obj.y, props));
              break;
          }
        });
      }
    });

    return result;
  }

  private static parseProperties(properties: any[] = []): Record<string, any> {
    const result: Record<string, any> = {};
    if (Array.isArray(properties)) {
      properties.forEach(prop => {
        result[prop.name] = prop.value;
      });
    }
    return result;
  }
}
