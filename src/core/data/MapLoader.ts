import Phaser from 'phaser';

// --- Tiled JSONデータ用の型定義 ---
// Tiled Map Editorが出力するJSONの構造に対応するインターフェース。
// これにより、TypeScriptの型安全性を確保し、データアクセスが容易になります。

interface TiledObject {
  id: number;
  name: string;
  type: string; // オブジェクトの種類（'player', 'enemy'など）
  x: number;
  y: number;
  properties: Record<string, any>; // Tiledで設定したカスタムプロパティ
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
  backgroundKey?: string; // 背景画像のキー（カスタムプロパティ）
}

// --- ゲームオブジェクト設定用の型定義 ---
// Tiledから読み込んだデータを、GameSceneで使いやすいように整形した型。

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

export type PlatformConfig = {
  x: number;
  y: number;
  properties: Record<string, any>;
};

// --- ローダーの返り値の型定義 ---

/**
 * MapLoaderが返す、すべてのオブジェクト設定情報をまとめた型。
 */
export type MapObjects = {
  player: PlayerConfig | null;
  enemies: EnemyConfig[];
  coins: CoinConfig[];
  hearts: HeartConfig[];
  keys: KeyConfig[];
  castles: CastleConfig[];
  platforms: PlatformConfig[];
  backgroundKey: string;
};

/**
 * @class MapLoader
 * @description
 * Tiled Map Editorで作成したJSONマップデータを解析するためのユーティリティクラス。
 *
 * 設計思想:
 * このクラスの責務は「データの解析と変換」のみに限定されています。
 * PhaserのGameObject（Spriteなど）を一切生成しないのがポイントです。
 *
 * 1. **関心の分離**: マップデータの「解釈」と、ゲームオブジェクトの「生成」を分離します。
 *    - `MapLoader`: データ構造を理解し、汎用的な設定オブジェクトに変換する。
 *    - `GameScene`: 設定オブジェクトを受け取り、具体的なゲームオブジェクトを生成する。
 * 2. **再利用性**: マップの仕様が変わっても、このローダーを修正するだけで済み、
 *    `GameScene`への影響を最小限に抑えられます。
 * 3. **可読性**: `GameScene`の`create`メソッドが、マップデータの複雑な構造に依存せず、
 *    すっきりと記述できます。
 */
export default class MapLoader {
  /**
   * Tiledのマップデータを解析し、すべてのゲームオブジェクトの設定情報を返します。
   * @param {TiledMap} tiledData - キャッシュから読み込んだ生のTiled JSONデータ。
   * @returns {MapObjects} ゲームオブジェクトの設定情報を含むオブジェクト。
   */
  static load(tiledData: TiledMap): MapObjects {
    const result: MapObjects = {
      player: null,
      enemies: [],
      coins: [],
      hearts: [],
      keys: [],
      castles: [],
      platforms: [],
      backgroundKey: tiledData.backgroundKey || 'background',
    };

    // 'game_objects'という名前のオブジェクトレイヤーを探す
    const objectLayer = tiledData.layers.find(layer => layer.name === 'game_objects');
    if (!objectLayer || !objectLayer.objects) {
      console.warn('MapLoader: "game_objects" layer not found or is empty.');
      return result;
    }

    // レイヤー内の各オブジェクトを処理
    for (const obj of objectLayer.objects) {
      // プロパティが存在しない場合に備え、デフォルトの空オブジェクトを用意
      const properties = obj.properties ?? {};

      // オブジェクトの'type'プロパティに応じて、対応する設定配列に追加
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
        case 'ground':
          result.platforms.push({ x: obj.x, y: obj.y, properties });
          break;
        default:
          console.warn(`MapLoader: Unknown object type "${obj.type}" found.`);
          break;
      }
    }

    return result;
  }
}
