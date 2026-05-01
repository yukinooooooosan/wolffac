export type AnimalData = {
  name: string;
  role: '♂' | '♀' | '';
  image: string;
  canBeWolf?: boolean;
  isWolf?: boolean;       // ←この行を追加！
  attackCount?: number;  // ← ここを追加
  lines: {
    normal?: string[];
    injured?: string[];
    survivedWhileInjured?: string[];
    dead?: string[];
    accused?: {
      select?: string[];
      start?: string[];
      hold1?: string[];
      hold2?: string[];
      confirm?: string[];
      confirmWolf?: string[];
      cancel?: string[];
    };
  };
  ledgerComments: {
    normal?: string[];
    injured?: string[];
    dead?: string[];
  };
};

export type WolfAttackRule = {
  injuryType: "random" | "targeted" | "maleOnly" | "self";
  maxInjuriesPerTurn: number;
  allowWolfSelfAttack?: boolean;
  attackCount?: number;
};

export type ScenarioData = {
  maxDays: number;
  id: string;
  title: string;
  selectCount: number;
  wolfAttackRule: WolfAttackRule;
  allowGenderRestriction: boolean;
  availableAnimals: AnimalData[];
  sectionTitle?: string;

  // 🔽 ここを差し替え
  // openingText?: string;

  opening?: {
    heading?: string;
    lines?: string[];
  };
};