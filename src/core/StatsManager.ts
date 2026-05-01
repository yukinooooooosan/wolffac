/**
 * プレイヤーの統計データを管理するクラス
 * LocalStorageを使用してデータを永続化
 */

const STORAGE_KEY = 'wolffac_player_stats';

export interface PlayerStats {
    totalGames: number;           // 総プレイ数
    totalAccusations: number;     // 累計告発数
    correctAccusations: number;   // 正しい告発数（オオカミを見つけた）
    wrongAccusations: number;     // 無実の告発数（間違えた）
    wins: number;                 // 勝利数
    injuryDefeats: number;        // 事故死による敗北数
    judgementDefeats: number;     // 誤告発による敗北数
    clearedScenarios: string[];   // クリア済みシナリオIDのリスト
}

export class StatsManager {
    private static stats: PlayerStats | null = null;

    /**
     * 初期統計データを返す
     */
    private static getDefaultStats(): PlayerStats {
        return {
            totalGames: 0,
            totalAccusations: 0,
            correctAccusations: 0,
            wrongAccusations: 0,
            wins: 0,
            injuryDefeats: 0,
            judgementDefeats: 0,
            clearedScenarios: [],
        };
    }

    /**
     * LocalStorageから統計データを読み込む
     */
    private static loadStats(): PlayerStats {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // デフォルト値とマージして、新しいプロパティにも対応
                const base = this.getDefaultStats();
                return { ...base, ...parsed, clearedScenarios: parsed.clearedScenarios || base.clearedScenarios };
            }
        } catch (error) {
            console.error('[StatsManager] Failed to load stats:', error);
        }
        return this.getDefaultStats();
    }

    /**
     * LocalStorageに統計データを保存
     */
    private static saveStats(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
        } catch (error) {
            console.error('[StatsManager] Failed to save stats:', error);
        }
    }

    /**
     * 統計データを取得（初回アクセス時に読み込み）
     */
    static getStats(): PlayerStats {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        return { ...this.stats }; // コピーを返す
    }

    /**
     * 総プレイ数を増やす
     */
    static incrementTotalGames(): void {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        this.stats.totalGames++;
        this.saveStats();
        console.log('[StatsManager] Total games:', this.stats.totalGames);
    }

    /**
     * 累計告発数を増やす
     */
    static incrementTotalAccusations(): void {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        this.stats.totalAccusations++;
        this.saveStats();
        console.log('[StatsManager] Total accusations:', this.stats.totalAccusations);
    }

    /**
     * 正しい告発数を増やす（オオカミを見つけた）
     */
    static incrementCorrectAccusations(): void {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        this.stats.correctAccusations++;
        this.saveStats();
        console.log('[StatsManager] Correct accusations:', this.stats.correctAccusations);
    }

    /**
     * 無実の告発数を増やす（間違えた）
     */
    static incrementWrongAccusations(): void {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        this.stats.wrongAccusations++;
        this.saveStats();
        console.log('[StatsManager] Wrong accusations:', this.stats.wrongAccusations);
    }

    /**
     * 勝利数を増やす
     */
    static incrementWins(): void {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        this.stats.wins++;
        this.saveStats();
        console.log('[StatsManager] Wins:', this.stats.wins);
    }

    /**
     * 事故死敗北数を増やす
     */
    static incrementInjuryDefeats(): void {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        this.stats.injuryDefeats++;
        this.saveStats();
        console.log('[StatsManager] Injury defeats:', this.stats.injuryDefeats);
    }

    /**
     * 誤告発敗北数を増やす
     */
    static incrementJudgementDefeats(): void {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        this.stats.judgementDefeats++;
        this.saveStats();
        console.log('[StatsManager] Judgement defeats:', this.stats.judgementDefeats);
    }

    /**
     * シナリオをクリア済みにする
     */
    static markScenarioCleared(scenarioId: string): void {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        if (!this.stats.clearedScenarios.includes(scenarioId)) {
            this.stats.clearedScenarios.push(scenarioId);
            this.saveStats();
            console.log(`[StatsManager] Scenario cleared: ${scenarioId}`);
        }
    }

    /**
     * シナリオがクリア済みか確認
     */
    static isScenarioCleared(scenarioId: string): boolean {
        if (!this.stats) {
            this.stats = this.loadStats();
        }
        return this.stats.clearedScenarios.includes(scenarioId);
    }

    /**
     * 統計データをリセット
     */
    static resetStats(): void {
        this.stats = this.getDefaultStats();
        this.saveStats();
        console.log('[StatsManager] Stats reset');
    }

    /**
     * デバッグ用：現在の統計をコンソールに出力
     */
    static logStats(): void {
        const stats = this.getStats();
        console.log('=== Player Statistics ===');
        console.log('総プレイ数:', stats.totalGames);
        console.log('累計告発数:', stats.totalAccusations);
        console.log('正しい告発:', stats.correctAccusations);
        console.log('無実の告発:', stats.wrongAccusations);
        console.log('勝利数:', stats.wins);
        console.log('事故死敗北:', stats.injuryDefeats);
        console.log('誤告発敗北:', stats.judgementDefeats);
        console.log('========================');
    }
}

// グローバルからアクセス可能にする（デバッグ用）
if (typeof window !== 'undefined') {
    (window as any).StatsManager = StatsManager;
}
