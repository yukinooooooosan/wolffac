import type { ScenarioData } from './types';

export async function loadScenario(id: string): Promise<ScenarioData> {
  const url = `/assets/scenarios/${id}.json`;
  console.log("fetch URL:", url); // ← ログでURLを確認

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`シナリオ "${id}" の読み込みに失敗しました`);
  }

  const data = await res.json();
  return data as ScenarioData;
}
