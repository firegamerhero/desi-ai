import axios from 'axios';

interface GameAsset {
  type: 'sprite' | 'sound' | 'background';
  url: string;
  name: string;
}

const assetSources = {
  sprites: ["https://opengameart.org/art-search", "https://kenney.nl/assets", "https://craftpix.net/freebies"],
  models3d: ["https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount", "https://www.turbosquid.com/Search/3D-Models/free", "https://free3d.com/3d-models"],
  textures: ["https://ambientcg.com/list?type=Atlas", "https://www.textures.com/free"],
  sounds: ["https://freesound.org", "https://opengameart.org/art-search-advanced?field_art_type_tid[]=13"],
  backgrounds: ["https://craftpix.net/freebies/category/backgrounds", "https://opengameart.org/art-search-advanced?field_art_type_tid[]=14"]
};

async function validateAssetUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}


export class GameAssetManager {
  private assets: Map<string, GameAsset> = new Map();

  async fetchAssetList(type: string, query: string): Promise<GameAsset[]> {
    const defaultAssets: Record<string, GameAsset[]> = {
      sprite: [
        {
          type: 'sprite',
          url: 'https://opengameart.org/content/animated-top-down-survivor-player',
          name: 'player'
        },
        {
          type: 'sprite',
          url: 'https://kenney.nl/assets/platformer-characters',
          name: 'characters'
        }
      ],
      background: [
        {
          type: 'background',
          url: 'https://craftpix.net/freebies/free-cartoon-forest-game-backgrounds/',
          name: 'forest-background'
        }
      ],
      sound: [
        {
          type: 'sound',
          url: 'https://freesound.org/people/soundslikewillem/sounds/190232/',
          name: 'jump'
        },
        {
          type: 'sound',
          url: 'https://freesound.org/people/DWOBoyle/sounds/474180/',
          name: 'background-music'
        }
      ]
    };

    return defaultAssets[type] || [];
  }

  async validateAsset(asset: GameAsset): Promise<boolean> {
    try {
      if (!asset.url || !asset.url.startsWith('http')) {
        return false;
      }
      const isValid = await validateAssetUrl(asset.url); // Use the new validation function
      return isValid;
    } catch (error) {
      console.error(`Asset validation error for ${asset.name}:`, error);
      return false;
    }
  }
}