import Phaser from 'phaser';

// --- Type Definitions for Tiled JSON Data ---

interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  properties: Record<string, any>;
}

interface TiledLayer {
  type: 'objectgroup';
  name: string;
  objects: TiledObject[];
}

interface TiledMap {
  width: number;
  height: number;
  layers: TiledLayer[];
}

// --- Configuration Types for Game Objects ---

export type PlayerConfig = {
  x: number;
  y: number;
  properties: Record<string, any>;
};

export type EnemyConfig = {
  x: number;
  y: number;
  properties: Record<string, any>;
};

export type CoinConfig = {
  x: number;
  y: number;
  properties: Record<string, any>;
};

export type KeyConfig = {
  x: number;
  y: number;
  properties: Record<string, any>;
};

export type HeartConfig = {
  x: number;
  y: number;
  properties: Record<string, any>;
};

export type CastleConfig = {
  x: number;
  y: number;
  properties: Record<string, any>;
};

// --- Result Type from the Loader ---

export type MapObjects = {
  player: PlayerConfig | null;
  enemies: EnemyConfig[];
  coins: CoinConfig[];
  hearts: HeartConfig[];
  keys: KeyConfig[];
  castles: CastleConfig[];
};

/**
 * A utility class for parsing Tiled map data.
 * It extracts object information and returns structured configuration objects,
 * but does not create any Phaser GameObjects itself.
 */
export default class MapLoader {
  /**
   * Parses the Tiled map data and returns configurations for all game objects.
   * @param tiledData The raw Tiled JSON data.
   * @returns A MapObjects object containing arrays of configurations.
   */
  static load(tiledData: TiledMap): MapObjects {
    const result: MapObjects = {
      player: null,
      enemies: [],
      coins: [],
      hearts: [],
      keys: [],
      castles: [],
    };

    // Find the 'game_objects' layer
    const objectLayer = tiledData.layers.find(layer => layer.name === 'game_objects');
    if (!objectLayer || !objectLayer.objects) {
      console.warn('MapLoader: "game_objects" layer not found or is empty.');
      return result;
    }

    // Process each object in the layer
    for (const obj of objectLayer.objects) {
      // Ensure properties exist, defaulting to an empty object if not.
      const properties = obj.properties ?? {};

      switch (obj.type) {
        case 'player':
          result.player = { x: obj.x, y: obj.y, properties };
          break;
        case 'enemy':
          result.enemies.push({ x: obj.x, y: obj.y, properties });
          break;
        case 'coin':
          result.coins.push({ x: obj.x, y: obj.y, properties });
          break;
        case 'key':
          result.keys.push({ x: obj.x, y: obj.y, properties });
          break;
        case 'heart':
          result.hearts.push({ x: obj.x, y: obj.y, properties });
          break;
        case 'castle':
          result.castles.push({ x: obj.x, y: obj.y, properties });
          break;
        default:
          console.warn(`MapLoader: Unknown object type "${obj.type}" found.`);
          break;
      }
    }

    return result;
  }
}
