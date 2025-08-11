import Enemy from '../Enemy';

/**
 * 敵のAIコントローラーを定義するインターフェース。
 * 新しいAIの挙動を追加する場合は、このインターフェースを実装します。
 */
export default interface IAIController {
  /**
   * 毎フレーム呼び出され、敵の行動を決定・実行します。
   * @param enemy 対象となる敵オブジェクト
   * @param delta 前フレームからの経過時間（ミリ秒）
   */
  update(enemy: Enemy, delta: number): void;
}
