import { GameState, AppState } from '../types';

export class LocalStorageManager {
  private static PREFIX = 'desi_ai_';

  static saveGame(gameId: string, state: GameState): void {
    try {
      localStorage.setItem(
        `${this.PREFIX}game_${gameId}`, 
        JSON.stringify({
          timestamp: Date.now(),
          state
        })
      );
    } catch (error) {
      console.error('Error saving game:', error);
    }
  }

  static loadGame(gameId: string): GameState | null {
    try {
      const saved = localStorage.getItem(`${this.PREFIX}game_${gameId}`);
      if (saved) {
        const { state } = JSON.parse(saved);
        return state;
      }
    } catch (error) {
      console.error('Error loading game:', error);
    }
    return null;
  }

  static saveApp(appId: string, state: AppState): void {
    try {
      localStorage.setItem(
        `${this.PREFIX}app_${appId}`,
        JSON.stringify({
          timestamp: Date.now(),
          state
        })
      );
    } catch (error) {
      console.error('Error saving app:', error);
    }
  }

  static loadApp(appId: string): AppState | null {
    try {
      const saved = localStorage.getItem(`${this.PREFIX}app_${appId}`);
      if (saved) {
        const { state } = JSON.parse(saved);
        return state;
      }
    } catch (error) {
      console.error('Error loading app:', error);
    }
    return null;
  }

  static getAllSavedGames(): Array<{id: string, timestamp: number}> {
    const games = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.PREFIX}game_`)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        games.push({
          id: key.replace(`${this.PREFIX}game_`, ''),
          timestamp: data.timestamp
        });
      }
    }
    return games;
  }

  static getAllSavedApps(): Array<{id: string, timestamp: number}> {
    const apps = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.PREFIX}app_`)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        apps.push({
          id: key.replace(`${this.PREFIX}app_`, ''),
          timestamp: data.timestamp
        });
      }
    }
    return apps;
  }

  static clearSavedGame(gameId: string): void {
    localStorage.removeItem(`${this.PREFIX}game_${gameId}`);
  }

  static clearSavedApp(appId: string): void {
    localStorage.removeItem(`${this.PREFIX}app_${appId}`);
  }
}