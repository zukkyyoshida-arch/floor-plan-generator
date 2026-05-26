export const materialCatalog = {
  pop: {
    general: { wall: 'SP2531 (ベース白)', ceiling: 'SP2531 (ベース白)', floor: 'WD2055 (ライトオーク)', accent: 'SP2543 (イエロー系)' },
    water: { wall: 'SP2531 (ベース白)', ceiling: 'SP2531 (ベース白)', floor: 'HM12040 (モザイクタイル調)', accent: 'SP2549 (ブルー系)' },
    accents: ['#ffeb3b', '#03a9f4', '#ff5722']
  },
  mono: {
    general: { wall: 'SP2531 (ベース白)', ceiling: 'SP2531 (ベース白)', floor: 'WD2058 (アッシュグレー)', accent: 'SP2545 (グレー系)' },
    water: { wall: 'SP2531 (ベース白)', ceiling: 'SP2531 (ベース白)', floor: 'HM12003 (モルタル調)', accent: 'SP2546 (ダークグレー系)' },
    accents: ['#eeeeee', '#9e9e9e', '#424242']
  },
  natural: {
    general: { wall: 'SP2531 (ベース白)', ceiling: 'SP2531 (ベース白)', floor: 'WD2051 (オーク木目)', accent: 'SP2533 (グレージュ系)' },
    water: { wall: 'SP2531 (ベース白)', ceiling: 'SP2531 (ベース白)', floor: 'HM12037 (テラコッタ調)', accent: 'SP2545 (モカグレー系)' },
    accents: ['#f5f5dc', '#ddebdd', '#e7d8c9']
  }
};

export const getRecommendedMaterials = (roomName, theme) => {
  const safeName = roomName || '';
  const isWaterRoom = /トイレ|風呂|UB|洗面|脱衣|キッチン/.test(safeName);
  const type = isWaterRoom ? 'water' : 'general';
  const mats = materialCatalog[theme]?.[type] || materialCatalog['natural'][type];
  
  // 玄関の場合は土間（フロアタイル等）を割り当てる等の特例
  if (safeName.includes('玄関')) {
    return { ...mats, floor: 'HM12003 (石目調)' };
  }
  return mats;
};

export const getThemeAccents = (theme) => {
  return materialCatalog[theme]?.accents || materialCatalog['natural'].accents;
};
