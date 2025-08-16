import Phaser from 'phaser';

/**
 * @interface QuizData
 * @description
 * 1問分のクイズデータを表現するオブジェクトの型定義です。
 * 問題文、選択肢、正解の文字列に加えて、カテゴリや出典情報などのメタデータも格納できます。
 */
export interface QuizData {
  question: string;
  choices: string[];
  answer: string;
  source: {
    text: string;
    url: string;
  };
}

/**
 * @class QuizDataManager
 * @description
 * クイズデータの管理に特化したクラスです。JSONファイルからのデータ読み込み、
 * カテゴリによるフィルタリング、そして出題する問題のランダムな選択といった責務を担います。
 *
 * [設計思想]
 * - **責務の分離 (SoC)**: クイズのデータ管理ロジックを、UIの表示や入力処理を行うシーン
 *   (`QuizScene`など) から完全に分離しています。これにより、`QuizScene`はクイズの
 *   見せ方や進行に集中でき、データソースの変更（例: JSONからAPI取得へ）があった場合も、
 *   このクラスの修正だけで対応可能になります。
 * - **状態管理**: `quizData`（マスターデータ）と `availableQuestions`（出題可能な問題リスト）
 *   という2つの状態を内部で管理しています。これにより、一度出題した問題がすぐに
 *   再出題されるのを防ぎ、すべての問題が一通り出題されたらリセットする、という
 *   一般的なクイズの挙動を実現しています。
 * - **堅牢性**: `load`メソッド内では、データの存在チェックや型チェックを行い、
 *   予期せぬデータ形式や読み込み失敗に対して警告を出し、安全に処理を中断する
 *   仕組み（早期リターン）を取り入れています。
 */
export default class QuizDataManager {
  private quizData: QuizData[] = [];
  private availableQuestions: QuizData[] = [];

  constructor(private scene: Phaser.Scene) {}

  /**
   * 指定されたカテゴリIDの配列を使い、Phaserのキャッシュからクイズデータを読み込みます。
   * 複数のカテゴリのクイズデータをすべて結合し、出題用の問題リストを初期化します。
   * @param categoryIds - `scene.load.json()`で事前に読み込んだ際のキー（カテゴリID）の配列。
   * @returns {boolean} データの読み込みと初期化が正常に完了した場合はtrue、失敗した場合はfalseを返します。
   */
  public load(categoryIds: string[]): boolean {
    try {
      let allQuizzes: QuizData[] = [];

      for (const id of categoryIds) {
        const data = this.scene.cache.json.get(id);
        if (data && Array.isArray(data)) {
          allQuizzes = allQuizzes.concat(data);
        } else {
          console.warn(`QuizDataManager: Invalid or missing quiz data for category ID: ${id}`);
        }
      }

      this.quizData = allQuizzes;

      if (this.quizData.length === 0) {
        console.warn(`QuizDataManager: No questions found for the provided categories.`);
        return false;
      }

      // 利用可能な問題のリストを初期化
      this.availableQuestions = [...this.quizData];
      return true;

    } catch (error) {
      console.warn('QuizDataManager: Failed to load quiz data', error);
      return false;
    }
  }

  /**
   * 出題可能な問題のリストから、ランダムに1問を取得して返します。
   * このメソッドは、一度取得した問題をリストから削除するため、連続して呼び出しても同じ問題は返されません。
   * 全ての問題が出題されると、リストは自動的にリセットされ、再度全ての問題が対象となります。
   * @returns {QuizData | undefined} ランダムに選ばれたクイズデータ。利用可能な問題が一つもない場合は `undefined` を返します。
   */
  public getRandomQuestion(): QuizData | undefined {
    if (this.availableQuestions.length === 0) {
      // 全ての問題を一度出題したら、リストをリセットする
      this.availableQuestions = [...this.quizData];
    }

    if (this.availableQuestions.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * this.availableQuestions.length);
    // spliceで問題を取り出すことで、重複しないようにする
    const question = this.availableQuestions.splice(randomIndex, 1)[0];
    return question;
  }
}
