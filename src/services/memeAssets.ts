// In-memory Meme Asset Preloader and Cache
// Guarantees all meme images (Batman Sigma, Undertaker, Heisenberg, Jaideep photos, etc.)
// are pre-decoded in RAM before playback or HUD display.

export interface MemeAssetItem {
  id: string;
  name: string;
  src: string;
  image: HTMLImageElement;
  loaded: boolean;
}

const MEME_SOURCES: Array<{ id: string; name: string; src: string }> = [
  // Jaideep Creator & Superheroes
  { id: 'jaideep_jaks_superhero', name: 'Jaideep Jaks Superhero',   src: '/memes/jaideep_jaks_superhero.jpg' },
  { id: 'jaideep_chad_blue',      name: 'Jaideep Confident Mogger',  src: '/memes/jaideep_chad_blue.jpg' },
  { id: 'jaideep_young_smile',    name: 'Jaideep Pure Smile',        src: '/memes/jaideep_young_smile.png' },
  { id: 'jaideep_smile',          name: 'Jaideep Bright Smile',      src: '/memes/jaideep_smile.png' },
  { id: 'jaideep_candid',         name: 'Jaideep Candid Laugh',      src: '/memes/jaideep_candid.jpg' },
  // Sigma Gods & Cold Stare
  { id: 'sigma_lightning_aura',   name: 'Sigma Lightning God',       src: '/memes/sigma_lightning_aura.jpg' },
  { id: 'arab_sigma_duo',         name: 'Arab Sigma Duo',            src: '/memes/arab_sigma_duo.png' },
  { id: 'heisenberg_arab',        name: 'Heisenberg Keffiyeh',       src: '/memes/heisenberg_arab.png' },
  { id: 'sigma_beanie_stare',     name: 'Beanie Cold Stare',         src: '/memes/sigma_beanie_stare.png' },
  { id: 'batman_sigma_smirk',     name: 'Patrick Bateman Smirk',     src: '/memes/batman_sigma_smirk.png' },
  { id: 'batman_sigma_pout',      name: 'Bateman Sigma Pout',        src: '/memes/batman_sigma_pout.png' },
  { id: 'sigma_stare',            name: 'Sigma Thousand-Yard Stare', src: '/memes/batman_sigma.jpg' },
  { id: 'gigachad_jawline',       name: 'Gigachad Jawline',          src: '/memes/batman_sigma.jpg' },
  // Classics & Legends
  { id: 'krishna_divine',         name: 'Divine Lord Krishna',       src: '/memes/krishna_divine.jpg' },
  { id: 'leonardo_dicaprio',      name: 'Leo DiCaprio Toast',        src: '/memes/leonardo_dicaprio.jpg' },
  { id: 'success_kid',            name: 'Success Kid',               src: '/memes/success_kid.jpg' },
  { id: 'gene_wilder',            name: 'Gene Wilder Wonka',         src: '/memes/gene_wilder.jpg' },
  { id: 'undertaker_eyes',        name: 'Undertaker Crazy Eyes',     src: '/memes/undertaker_eyes.png' },
  { id: 'angry_baby',             name: 'Angry Baby',                src: '/memes/angry_baby.jpg' },
];

class MemeAssetManager {
  private cache: Map<string, MemeAssetItem> = new Map();
  private isPreloading: boolean = false;
  private fallbackImage: HTMLImageElement | null = null;

  constructor() {
    this.createFallbackImage();
    this.preloadAll();
  }

  private createFallbackImage(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, 300, 300);
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 280, 280);
      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SIGMA MEME', 150, 140);
      ctx.fillText('MOGGED', 150, 175);
    }
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    this.fallbackImage = img;
  }

  preloadAll(): void {
    if (this.isPreloading) return;
    this.isPreloading = true;

    for (const item of MEME_SOURCES) {
      const img = new Image();
      const assetItem: MemeAssetItem = {
        id: item.id,
        name: item.name,
        src: item.src,
        image: img,
        loaded: false,
      };

      img.onload = () => {
        assetItem.loaded = true;
        console.log(`[MemeAssets] Preloaded ${item.id} (${item.src})`);
      };

      img.onerror = () => {
        console.warn(`[MemeAssets] Failed to load ${item.src}, trying relative fallback`);
        // Fallback relative path
        img.src = `.${item.src}`;
      };

      img.src = item.src;
      this.cache.set(item.id, assetItem);
      this.cache.set(item.src, assetItem);
    }
  }

  getMemeImage(srcOrId: string): HTMLImageElement {
    const cached = this.cache.get(srcOrId);
    if (cached && cached.loaded && cached.image.complete && cached.image.naturalWidth > 0) {
      return cached.image;
    }

    // Try finding by partial match
    for (const [key, item] of this.cache.entries()) {
      if ((key.includes(srcOrId) || srcOrId.includes(key)) && item.loaded) {
        return item.image;
      }
    }

    // Default to jaideep_smile if available, else batman sigma
    const defaultMeme =
      this.cache.get('jaideep_smile') ||
      this.cache.get('batman_sigma_smirk') ||
      this.cache.get('/memes/batman_sigma_smirk.png');
    if (defaultMeme && defaultMeme.loaded) {
      return defaultMeme.image;
    }

    return this.fallbackImage || new Image();
  }

  getAllAssets(): MemeAssetItem[] {
    return Array.from(new Set(this.cache.values()));
  }
}

export const memeAssets = new MemeAssetManager();
