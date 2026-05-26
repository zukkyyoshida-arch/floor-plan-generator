export const generateEstimateItems = (rooms = [], fixtures = [], unitPrices = {}) => {
  const items = [];
  
  // 1. 仮設・解体・大工工事
  items.push({ name: '各種養生費', qty: 1, unit: '式', price: 30000 });
  items.push({ name: '各種搬出・搬入・運搬費資材運搬費等', qty: 1, unit: '式', price: 32000 });
  items.push({ name: '既存間仕切り・設備等 解体撤去', qty: 1, unit: '式', price: unitPrices.demo || 150000 });
  items.push({ name: '廃材運搬車両・処分費', qty: 1, unit: '式', price: unitPrices.disposal || 130000 });
  items.push({ name: '大工工事・各所下地組・ボード貼り', qty: 1, unit: '式', price: unitPrices.carpenter || 150000 });
  items.push({ name: '電気工事・配線・スイッチ取替', qty: 1, unit: '式', price: 85000 });
  items.push({ name: '給排水設備工事・配管部材費等', qty: 1, unit: '式', price: 65000 });

  // 2. 設備工事 (fixtures & room types)
  let kitchenCount = 0, toiletCount = 0, doorCount = 0, windowCount = 0;
  (fixtures || []).forEach(f => {
    if (f && f.type === 'kitchen') kitchenCount++;
    if (f && f.type === 'toilet') toiletCount++;
    if (f && f.type === 'door_single') doorCount++;
    if (f && f.type === 'window') windowCount++;
  });
  
  const hasUB = (rooms || []).some(r => (r && r.name) ? (r.name.includes('UB') || r.name.includes('風呂')) : false);
  const hasWashroom = (rooms || []).some(r => (r && r.name) ? r.name.includes('洗面') : false);

  if (hasUB) {
    items.push({ name: 'ユニットバス 搬入・組立・材工共', qty: 1, unit: '式', price: unitPrices.ub || 550000 });
  }
  if (hasWashroom) {
    items.push({ name: '洗面化粧台 取付費・材工共', qty: 1, unit: '式', price: unitPrices.washstand || 250000 });
  }
  if (kitchenCount > 0) {
    items.push({ name: 'システムキッチン 取付費・材工共', qty: kitchenCount, unit: '式', price: unitPrices.kitchen || 450000 });
  }
  if (toiletCount > 0) {
    items.push({ name: '温水洗浄便座機器 取付費・材工共', qty: toiletCount, unit: '式', price: unitPrices.toilet || 120000 });
  }
  if (doorCount > 0) {
    items.push({ name: '建具等新建材 取付費・材工共', qty: doorCount, unit: '式', price: unitPrices.door || 65000 });
  }

  // 3. 内装工事 (rooms)
  (rooms || []).forEach(r => {
    if (!r) return;
    const roomName = r.name || '不明';
    const sqm = ((r.w || 0) / 1000) * ((r.h || 0) / 1000);
    // 天井クロス
    items.push({ name: `クロス工事 ${roomName} 天井`, qty: Number(sqm.toFixed(1)), unit: 'm', price: unitPrices.cross || 950 });
    // 壁クロス (平米 x 2.5)
    const wallM = sqm * 2.5;
    items.push({ name: `クロス工事 ${roomName} 壁`, qty: Number(wallM.toFixed(1)), unit: 'm', price: unitPrices.cross || 950 });
    
    // 床工事
    const isWater = /トイレ|風呂|UB|洗面|脱衣|キッチン/.test(roomName);
    if (!roomName.includes('UB') && !roomName.includes('風呂')) { 
      if (isWater) {
        items.push({ name: `クッションフロア工事 ${roomName}`, qty: Number(sqm.toFixed(1)), unit: '㎡', price: unitPrices.cf || 2800 });
      } else {
        items.push({ name: `フロアタイル工事 ${roomName}`, qty: Number(sqm.toFixed(1)), unit: '㎡', price: unitPrices.floorTile || 6000 });
        // 巾木
        const perimeter = (((r.w || 0) / 1000) + ((r.h || 0) / 1000)) * 2;
        items.push({ name: `ソフト巾木貼替 ${roomName}`, qty: Number(perimeter.toFixed(1)), unit: 'm', price: unitPrices.baseboard || 450 });
      }
    }
  });

  // 4. クリーニング・その他
  items.push({ name: 'ルームクリーニング', qty: 1, unit: '式', price: 35000 });
  items.push({ name: '現場巡回管理費・諸経費', qty: 1, unit: '式', price: 150000 });

  return items;
};
