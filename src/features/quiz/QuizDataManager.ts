import Phaser from 'phaser';

// クイズデータの構造を定義
export interface QuizData {
  question: string;
  choices: string[];
  answer: string;
  category?: string;
  source_chunk?: string;
  source_metadata?: {
    file?: string;
    page?: number;
  };
}

/**
 * クイズデータの読み込み、検証、選択を担当するクラス
 */
export default class QuizDataManager {
  private quizData: QuizData[] = [];
  private availableQuestions: QuizData[] = [];

  constructor(private scene: Phaser.Scene) {}

  /**
   * JSONファイルからクイズデータを読み込み、検証・フィルタリングする
   * @param cacheKey - プリロード時に使用したJSONのキー
   * @param category - フィルタリングするカテゴリ（未指定の場合は全件）
   * @returns 読み込みと検証が成功したかどうか
   */
  public load(cacheKey: string, category?: string): boolean {
    try {
      const data = this.scene.cache.json.get(cacheKey);

      if (!data || !Array.isArray(data)) {
        console.warn('QuizDataManager: Invalid quiz data format');
        return false;
      }

      // カテゴリでフィルタリング
      if (category) {
        this.quizData = data.filter(item =>
          item.category === category ||
          (category === 'general' && !item.category)
        );
      } else {
        this.quizData = data;
      }

      if (this.quizData.length === 0) {
        console.warn(`QuizDataManager: No questions found for category: ${category || 'all'}`);
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
   * 利用可能な問題からランダムに1つ選択して返す
   * 一度出題された問題は、すべての問題が出題されるまで再出題されない
   * @returns ランダムに選択されたクイズデータ。利用可能な問題がない場合はundefined
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
