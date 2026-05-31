import React, { useState, useEffect, useRef, useMemo } from 'react';
import FloorPlanViewer from './FloorPlanViewer';
import { sampleFloorPlan } from './data';
import ProposalModal from './ProposalModal';
import EstimateModal from './EstimateModal';
import SalesTipsModal from './SalesTipsModal';
import { generateEstimateItems } from './estimateLogic';

function App() {
  const fileInputRef = useRef(null);
  const [rooms, setRooms] = useState(sampleFloorPlan.rooms);
  const [fixtures, setFixtures] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);
  
  const [theme, setTheme] = useState('pop'); // pop, mono, natural
  const [watermark, setWatermark] = useState('〇〇内装株式会社');
  const [isSnapEnabled, setIsSnapEnabled] = useState(true);
  
  const [unitPrices, setUnitPrices] = useState({
    floor: 3000, // ヘッダーのざっくり表示用
    wall: 950,   // ヘッダー用
    ceiling: 950,
    // 詳細見積書用
    cross: 950,
    floorTile: 6000,
    cf: 2800,
    baseboard: 450,
    ub: 550000,
    kitchen: 450000,
    toilet: 120000,
    washstand: 250000,
    door: 65000,
    demo: 150000,
    disposal: 130000,
    carpenter: 150000,
  });
  const [isEstimateVisible, setIsEstimateVisible] = useState(true);
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [isSalesTipsModalOpen, setIsSalesTipsModalOpen] = useState(false);
  
  // 簡易Undo用ヒストリー
  const [history, setHistory] = useState([{ rooms: sampleFloorPlan.rooms, fixtures: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // レスポンシブ用ステート
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTrayOpen, setIsTrayOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveHistory = (newRooms, newFixtures) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ rooms: newRooms, fixtures: newFixtures });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRooms(history[historyIndex - 1].rooms);
      setFixtures(history[historyIndex - 1].fixtures);
      setSelectedRoomId(null);
      setSelectedFixtureId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setRooms(history[historyIndex + 1].rooms);
      setFixtures(history[historyIndex + 1].fixtures);
      setSelectedRoomId(null);
      setSelectedFixtureId(null);
    }
  };

  // コピー用ステート
  const [clipboard, setClipboard] = useState(null);

  const handleDuplicate = () => {
    if (selectedRoomId) {
      const target = rooms.find(r => r.id === selectedRoomId);
      if (target) {
        const newRoom = { ...target, id: `room_${Date.now()}`, x: target.x + 500, y: target.y + 500 };
        const newRooms = [...rooms, newRoom];
        setRooms(newRooms);
        setSelectedRoomId(newRoom.id);
        saveHistory(newRooms, fixtures);
      }
    } else if (selectedFixtureId) {
      const target = fixtures.find(f => f.id === selectedFixtureId);
      if (target) {
        const newFixture = { ...target, id: `fixture_${Date.now()}`, x: target.x + 500, y: target.y + 500 };
        const newFixtures = [...fixtures, newFixture];
        setFixtures(newFixtures);
        setSelectedFixtureId(newFixture.id);
        saveHistory(rooms, newFixtures);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (isCmdOrCtrl && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (isCmdOrCtrl && (e.key === 'c' || e.key === 'C')) {
        if (selectedRoomId) {
          setClipboard({ type: 'room', data: rooms.find(r => r.id === selectedRoomId) });
        } else if (selectedFixtureId) {
          setClipboard({ type: 'fixture', data: fixtures.find(f => f.id === selectedFixtureId) });
        }
        return;
      }

      if (isCmdOrCtrl && (e.key === 'v' || e.key === 'V')) {
        if (clipboard) {
          if (clipboard.type === 'room' && clipboard.data) {
            const newRoom = { ...clipboard.data, id: `room_${Date.now()}`, x: clipboard.data.x + 500, y: clipboard.data.y + 500 };
            const newRooms = [...rooms, newRoom];
            setRooms(newRooms);
            setSelectedRoomId(newRoom.id);
            setSelectedFixtureId(null);
            saveHistory(newRooms, fixtures);
            setClipboard({ type: 'room', data: newRoom }); // Update clipboard so repeated pastes offset further
          } else if (clipboard.type === 'fixture' && clipboard.data) {
            const newFixture = { ...clipboard.data, id: `fixture_${Date.now()}`, x: clipboard.data.x + 500, y: clipboard.data.y + 500 };
            const newFixtures = [...fixtures, newFixture];
            setFixtures(newFixtures);
            setSelectedFixtureId(newFixture.id);
            setSelectedRoomId(null);
            saveHistory(rooms, newFixtures);
            setClipboard({ type: 'fixture', data: newFixture });
          }
        }
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedRoomId) {
          const newRooms = rooms.filter(r => r.id !== selectedRoomId);
          setRooms(newRooms);
          setSelectedRoomId(null);
          saveHistory(newRooms, fixtures);
        }
        if (selectedFixtureId) {
          const newFixtures = fixtures.filter(f => f.id !== selectedFixtureId);
          setFixtures(newFixtures);
          setSelectedFixtureId(null);
          saveHistory(rooms, newFixtures);
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (selectedFixtureId) {
          const newFixtures = fixtures.map(f => 
            f.id === selectedFixtureId ? { ...f, rotation: (f.rotation + 90) % 360 } : f
          );
          setFixtures(newFixtures);
          saveHistory(rooms, newFixtures);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoomId, selectedFixtureId, history, historyIndex, rooms, fixtures, clipboard]);

  const handleRoomUpdate = (id, newX, newY, newW, newH, isDragging = false) => {
    const newRooms = rooms.map(r => {
      if (r.id === id) {
        let updated = { ...r, x: newX, y: newY };
        if (newW !== undefined && newH !== undefined) {
          updated.w = newW;
          updated.h = newH;
          const sqm = (newW / 1000) * (newH / 1000);
          updated.area = r.area.includes('帖') ? (sqm / 1.62).toFixed(1) + '帖' : sqm.toFixed(2) + '㎡';
        }
        return updated;
      }
      return r;
    });
    setRooms(newRooms);
    if (!isDragging) saveHistory(newRooms, fixtures);
  };

  const handleFixtureUpdate = (id, newX, newY, isDragging = false) => {
    const newFixtures = fixtures.map(f => f.id === id ? { ...f, x: newX, y: newY } : f);
    setFixtures(newFixtures);
    if (!isDragging) saveHistory(rooms, newFixtures);
  };

  const handleAddRoom = (name, defaultW, defaultH) => {
    const newRoom = {
      id: `room_${Date.now()}`,
      name,
      w: defaultW,
      h: defaultH,
      x: 0,
      y: 0,
      area: ((defaultW / 1000) * (defaultH / 1000)).toFixed(2) + '㎡'
    };
    const newRooms = [...rooms, newRoom];
    setRooms(newRooms);
    setSelectedFixtureId(null);
    saveHistory(newRooms, fixtures);
    if (isMobile) setIsTrayOpen(false); // スマホでは配置後にトレイを閉じる
  };

  const handleAddFixture = (type, defaultW, defaultH = 1000) => {
    const newFixture = {
      id: `fixture_${Date.now()}`,
      type,
      w: defaultW,
      h: defaultH,
      x: 0,
      y: 0,
      rotation: 0
    };
    const newFixtures = [...fixtures, newFixture];
    setFixtures(newFixtures);
    setSelectedRoomId(null);
    saveHistory(rooms, newFixtures);
    if (isMobile) setIsTrayOpen(false);
  };

  const handleDelete = () => {
    if (selectedRoomId) {
      const newRooms = rooms.filter(r => r.id !== selectedRoomId);
      setRooms(newRooms);
      setSelectedRoomId(null);
      saveHistory(newRooms, fixtures);
    }
    if (selectedFixtureId) {
      const newFixtures = fixtures.filter(f => f.id !== selectedFixtureId);
      setFixtures(newFixtures);
      setSelectedFixtureId(null);
      saveHistory(rooms, newFixtures);
    }
  };

  const handleRecalculateArea = (unit) => {
    const newRooms = rooms.map(r => {
      const sqm = (r.w / 1000) * (r.h / 1000);
      let areaText = '';
      if (unit === 'sqm') areaText = sqm.toFixed(2) + '㎡';
      if (unit === 'jo') areaText = (sqm / 1.62).toFixed(1) + '帖';
      return { ...r, area: areaText };
    });
    setRooms(newRooms);
    saveHistory(newRooms, fixtures);
  };

  const handleExport = () => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const prevSelectedRoom = selectedRoomId;
    const prevSelectedFixture = selectedFixtureId;
    setSelectedRoomId(null);
    setSelectedFixtureId(null);

    setTimeout(() => {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `floorplan.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSelectedRoomId(prevSelectedRoom);
      setSelectedFixtureId(prevSelectedFixture);
    }, 50);
  };

  const handleExportPNG = () => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const prevSelectedRoom = selectedRoomId;
    const prevSelectedFixture = selectedFixtureId;
    setSelectedRoomId(null);
    setSelectedFixtureId(null);

    setTimeout(() => {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      const svgSize = svgElement.getBoundingClientRect();
      canvas.width = svgSize.width * 2;
      canvas.height = svgSize.height * 2;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = function() {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngFile = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `floorplan.png`;
        link.href = pngFile;
        link.click();
        setSelectedRoomId(prevSelectedRoom);
        setSelectedFixtureId(prevSelectedFixture);
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
    }, 50);
  };

  const handleSaveJson = () => {
    const data = { rooms, fixtures, theme, watermark, unitPrices, isEstimateVisible };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `floorplan_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.rooms) setRooms(data.rooms);
        if (data.fixtures) setFixtures(data.fixtures);
        if (data.theme) setTheme(data.theme);
        if (data.watermark !== undefined) setWatermark(data.watermark);
        if (data.unitPrices) {
          setUnitPrices(prev => ({ ...prev, ...data.unitPrices }));
        }
        if (data.isEstimateVisible !== undefined) setIsEstimateVisible(data.isEstimateVisible);
        saveHistory(data.rooms || [], data.fixtures || []);
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalSqm = rooms.reduce((sum, r) => sum + ((r.w / 1000) * (r.h / 1000)), 0);
  
  const estimateItems = useMemo(() => generateEstimateItems(rooms, fixtures, unitPrices), [rooms, fixtures, unitPrices]);
  const subTotal = estimateItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const totalEstimate = subTotal + Math.round(subTotal * 0.1); // 税込

  const currentData = {
    rooms,
    fixtures,
    theme,
    watermark
  };

  const paletteItems = [
    { name: '洋室', w: 2500, h: 2500, color: '#e3f2fd' },
    { name: '和室', w: 3000, h: 3000, color: '#e8f5e9' },
    { name: 'LDK', w: 4000, h: 3000, color: '#fff3e0' },
    { name: 'トイレ', w: 1000, h: 1000, color: '#f3e5f5' },
    { name: 'UB (風呂)', w: 2000, h: 2000, color: '#e0f7fa' },
    { name: 'クローゼット', w: 1500, h: 1000, color: '#efebe9' },
  ];

  const SidebarContent = () => (
    <>
      {/* Settings Area */}
      <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#aaa' }}>テーマカラー</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%', padding: '0.6rem', marginTop: '0.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none' }}>
            <option value="pop">ポップ（カラー）</option>
            <option value="mono">白黒（青焼き・CAD風）</option>
            <option value="natural">ナチュラル（木目・アース調）</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#aaa' }}>面積の一括再計算</label>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            <button onClick={() => handleRecalculateArea('sqm')} className="glass-btn">㎡で計算</button>
            <button onClick={() => handleRecalculateArea('jo')} className="glass-btn">帖で計算</button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#aaa' }}>透かし文字（ロゴ）</label>
          <input type="text" value={watermark} onChange={e => setWatermark(e.target.value)} style={{ width: '100%', padding: '0.6rem', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', marginTop: '0.4rem', outline: 'none' }} />
        </div>
        <div style={{ marginTop: '0.4rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#aaa' }}>
            <input 
              type="checkbox" 
              checked={isSnapEnabled} 
              onChange={e => setIsSnapEnabled(e.target.checked)} 
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            スナップ（自動吸着）を有効にする
          </label>
        </div>
        <div style={{ marginTop: '0.5rem', padding: '0.8rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#aaa' }}>概算見積・明細単価設定</label>
          
          <details style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ccc' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '0.3rem', borderRadius: '4px', outline: 'none' }}>内装単価を展開</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>クロス (円/m):</span>
                <input type="number" value={unitPrices.cross} onChange={e => setUnitPrices({...unitPrices, cross: parseInt(e.target.value) || 0, wall: parseInt(e.target.value) || 0})} className="glass-input" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>フロアタイル (円/㎡):</span>
                <input type="number" value={unitPrices.floorTile} onChange={e => setUnitPrices({...unitPrices, floorTile: parseInt(e.target.value) || 0})} className="glass-input" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>クッションフロア (円/㎡):</span>
                <input type="number" value={unitPrices.cf} onChange={e => setUnitPrices({...unitPrices, cf: parseInt(e.target.value) || 0})} className="glass-input" />
              </div>
            </div>
          </details>

          <details style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ccc' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '0.3rem', borderRadius: '4px', outline: 'none' }}>設備単価を展開</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>キッチン (円/式):</span>
                <input type="number" value={unitPrices.kitchen} onChange={e => setUnitPrices({...unitPrices, kitchen: parseInt(e.target.value) || 0})} className="glass-input" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>ユニットバス (円/式):</span>
                <input type="number" value={unitPrices.ub} onChange={e => setUnitPrices({...unitPrices, ub: parseInt(e.target.value) || 0})} className="glass-input" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>トイレ・便座 (円/式):</span>
                <input type="number" value={unitPrices.toilet} onChange={e => setUnitPrices({...unitPrices, toilet: parseInt(e.target.value) || 0})} className="glass-input" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>洗面台 (円/式):</span>
                <input type="number" value={unitPrices.washstand} onChange={e => setUnitPrices({...unitPrices, washstand: parseInt(e.target.value) || 0})} className="glass-input" />
              </div>
            </div>
          </details>
        </div>
      </div>
      
      {/* Palette Area */}
      <div style={{ padding: '1.2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#fff' }}>部屋を追加</h3>
        <div style={{ display: isMobile ? 'grid' : 'flex', gridTemplateColumns: isMobile ? '1fr 1fr' : 'none', flexDirection: isMobile ? 'row' : 'column', gap: '0.6rem' }}>
          {paletteItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleAddRoom(item.name, item.w, item.h)}
              className="room-btn"
              style={{
                padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#fff',
                transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ width: '24px', height: '24px', backgroundColor: item.color, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '4px', flexShrink: 0 }}></div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.name}</span>
              </div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.2rem' }}>
          <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#fff' }}>家具・建具スタンプ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button onClick={() => handleAddFixture('door_single', 900)} className="fixture-btn">🚪 ドア</button>
            <button onClick={() => handleAddFixture('window', 1800)} className="fixture-btn">🪟 窓</button>
            <button onClick={() => handleAddFixture('kitchen', 2500)} className="fixture-btn">🍳 キッチン</button>
            <button onClick={() => handleAddFixture('toilet', 800)} className="fixture-btn">🚽 トイレ</button>
            <button onClick={() => handleAddFixture('bed', 1200)} className="fixture-btn">🛏️ ベッド</button>
            <button onClick={() => handleAddFixture('sofa', 1800)} className="fixture-btn">🛋️ ソファ</button>
            <button onClick={() => handleAddFixture('tv', 1500)} className="fixture-btn">📺 テレビ</button>
            <button onClick={() => handleAddFixture('dining', 1600)} className="fixture-btn">🍽️ ダイニング</button>
            <button onClick={() => handleAddFixture('washing_machine', 700)} className="fixture-btn">🧺 洗濯機</button>
            <button onClick={() => handleAddFixture('plant', 600)} className="fixture-btn">🪴 観葉植物</button>
          </div>
        </div>
      </div>

      {/* Delete & Edit Area */}
      <div style={{ padding: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 20px)' : '1.2rem' }}>
        {selectedRoomId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>部屋名:</label>
            <input 
              type="text" 
              value={rooms.find(r => r.id === selectedRoomId)?.name || ''}
              onChange={(e) => {
                const newRooms = rooms.map(r => r.id === selectedRoomId ? { ...r, name: e.target.value } : r);
                setRooms(newRooms);
              }}
              onBlur={() => saveHistory(rooms, fixtures)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>幅(W) mm:</label>
                <input 
                  type="number"
                  value={rooms.find(r => r.id === selectedRoomId)?.w || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const newRooms = rooms.map(r => {
                      if (r.id === selectedRoomId) {
                        const sqm = (val / 1000) * (r.h / 1000);
                        const isJo = r.area.includes('帖');
                        const newArea = isJo ? (sqm / 1.62).toFixed(1) + '帖' : sqm.toFixed(2) + '㎡';
                        return { ...r, w: val, area: newArea };
                      }
                      return r;
                    });
                    setRooms(newRooms);
                  }}
                  onBlur={() => saveHistory(rooms, fixtures)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>奥行(H) mm:</label>
                <input 
                  type="number"
                  value={rooms.find(r => r.id === selectedRoomId)?.h || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const newRooms = rooms.map(r => {
                      if (r.id === selectedRoomId) {
                        const sqm = (r.w / 1000) * (val / 1000);
                        const isJo = r.area.includes('帖');
                        const newArea = isJo ? (sqm / 1.62).toFixed(1) + '帖' : sqm.toFixed(2) + '㎡';
                        return { ...r, h: val, area: newArea };
                      }
                      return r;
                    });
                    setRooms(newRooms);
                  }}
                  onBlur={() => saveHistory(rooms, fixtures)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.25rem' }}>面積表示:</label>
            <input 
              type="text" 
              value={rooms.find(r => r.id === selectedRoomId)?.area || ''}
              onChange={(e) => {
                const newRooms = rooms.map(r => r.id === selectedRoomId ? { ...r, area: e.target.value } : r);
                setRooms(newRooms);
              }}
              onBlur={() => saveHistory(rooms, fixtures)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        )}
        
        {selectedFixtureId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>建具・家具の設定</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>幅(W) mm:</label>
                <input 
                  type="number"
                  value={fixtures.find(f => f.id === selectedFixtureId)?.w || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const newFixtures = fixtures.map(f => f.id === selectedFixtureId ? { ...f, w: val } : f);
                    setFixtures(newFixtures);
                  }}
                  onBlur={() => saveHistory(rooms, fixtures)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>奥行(H) mm:</label>
                <input 
                  type="number"
                  value={fixtures.find(f => f.id === selectedFixtureId)?.h || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const newFixtures = fixtures.map(f => f.id === selectedFixtureId ? { ...f, h: val } : f);
                    setFixtures(newFixtures);
                  }}
                  onBlur={() => saveHistory(rooms, fixtures)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  disabled={fixtures.find(f => f.id === selectedFixtureId)?.type === 'door_single' || fixtures.find(f => f.id === selectedFixtureId)?.type === 'window'}
                />
              </div>
            </div>

            <button 
              onClick={() => {
                const newFixtures = fixtures.map(f => f.id === selectedFixtureId ? { ...f, rotation: (f.rotation + 90) % 360 } : f);
                setFixtures(newFixtures);
                saveHistory(rooms, newFixtures);
              }}
              style={{ padding: '0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', marginTop: '0.5rem' }}
            >
              🔄 90度回転
            </button>
          </div>
        )}

        {!selectedRoomId && !selectedFixtureId && (
          <p style={{ fontSize: '0.85rem', color: '#888', textAlign: 'center', margin: 0 }}>パーツを選択すると編集できます</p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            onClick={handleDuplicate}
            disabled={!selectedRoomId && !selectedFixtureId}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: (selectedRoomId || selectedFixtureId) ? '#17a2b8' : '#e0e0e0',
              color: (selectedRoomId || selectedFixtureId) ? 'white' : '#888',
              border: 'none',
              borderRadius: '4px',
              cursor: (selectedRoomId || selectedFixtureId) ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            📋 複製
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedRoomId && !selectedFixtureId}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: (selectedRoomId || selectedFixtureId) ? '#ff4c4c' : '#e0e0e0',
              color: (selectedRoomId || selectedFixtureId) ? 'white' : '#888',
              border: 'none',
              borderRadius: '4px',
              cursor: (selectedRoomId || selectedFixtureId) ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            🗑️ 削除
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#111315', color: '#e0e0e0' }}>
      <header className="glass-header" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', zIndex: 110, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isMobile && (
            <button 
              onClick={() => setIsTrayOpen(!isTrayOpen)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem 0 0' }}
            >
              ☰
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.5rem' }}>Floor Plan</h1>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ backgroundColor: '#555', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                {totalSqm.toFixed(1)}㎡ / {(totalSqm / 1.62).toFixed(1)}帖
              </span>
              <span style={{ backgroundColor: '#555', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span onClick={() => setIsEstimateVisible(!isEstimateVisible)} style={{ cursor: 'pointer' }}>
                  {isEstimateVisible ? '👁️' : '🙈'}
                </span>
                {isEstimateVisible ? `概算: ¥${totalEstimate.toLocaleString()}` : '概算: ¥---,---'}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {isMobile && (
            <>
              <span style={{ backgroundColor: '#555', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {totalSqm.toFixed(1)}㎡
              </span>
              <span style={{ backgroundColor: '#555', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span onClick={() => setIsEstimateVisible(!isEstimateVisible)} style={{ cursor: 'pointer' }}>
                  {isEstimateVisible ? '👁️' : '🙈'}
                </span>
                {isEstimateVisible ? `¥${totalEstimate.toLocaleString()}` : '¥---'}
              </span>
            </>
          )}
          <button onClick={undo} disabled={historyIndex === 0} style={{ cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', border: 'none' }}>↩️</button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} style={{ cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', border: 'none' }}>↪️</button>
          
          <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleLoadJson} />
          {!isMobile && (
            <>
              <button 
                onClick={() => setIsSalesTipsModalOpen(true)}
                style={{ padding: '0.4rem 0.6rem', cursor: 'pointer', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 'bold' }}
              >
                💡 提案のコツ
              </button>
              <button 
                onClick={() => setIsEstimateModalOpen(true)}
                style={{ padding: '0.4rem 0.6rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 'bold' }}
              >
                💴 見積書
              </button>
              <button 
                onClick={() => setIsProposalOpen(true)}
                style={{ padding: '0.4rem 0.6rem', cursor: 'pointer', backgroundColor: '#e91e63', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 'bold' }}
              >
                📄 提案書
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '0.4rem', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '0.5rem' }}
              >
                📂
              </button>
              <button 
                onClick={handleSaveJson}
                style={{ padding: '0.4rem', cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                💾
              </button>
            </>
          )}
          <button 
            onClick={handleExport}
            style={{ padding: '0.5rem 0.8rem', cursor: 'pointer', backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50', border: '1px solid #4CAF50', borderRadius: '8px', marginLeft: '0.5rem', fontWeight: 'bold', transition: 'all 0.2s' }}
          >
            SVG出力
          </button>
          <button 
            onClick={handleExportPNG}
            style={{ padding: '0.5rem 0.8rem', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', marginLeft: '0.5rem', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)' }}
          >
            📸 画像保存
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Desktop Sidebar OR Mobile Slide-in Menu */}
        <aside className="glass-sidebar" style={{ 
          width: isMobile ? '80%' : '340px', 
          maxWidth: '340px',
          display: 'flex', 
          flexDirection: 'column', 
          zIndex: 100,
          position: isMobile ? 'absolute' : 'relative',
          top: 0,
          bottom: 0,
          left: 0,
          transform: isMobile ? (isTrayOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isMobile && isTrayOpen ? '10px 0 30px rgba(0,0,0,0.5)' : '1px 0 0 rgba(255,255,255,0.05)'
        }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <SidebarContent />
            {isMobile && (
              <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid #ddd', backgroundColor: '#fff' }}>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  📂 ロード
                </button>
                <button 
                  onClick={handleSaveJson}
                  style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  💾 セーブ
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Overlay for mobile when menu is open */}
        {isMobile && isTrayOpen && (
          <div 
            onClick={() => setIsTrayOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 90 }}
          />
        )}

        <main style={{ flex: 1, backgroundColor: '#090a0c', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', touchAction: 'none' }}>
          <FloorPlanViewer 
            data={currentData} 
            onRoomUpdate={handleRoomUpdate} 
            onFixtureUpdate={handleFixtureUpdate}
            selectedRoomId={selectedRoomId}
            onSelectRoom={(id) => { setSelectedRoomId(id); setSelectedFixtureId(null); }}
            selectedFixtureId={selectedFixtureId}
            onSelectFixture={(id) => { setSelectedFixtureId(id); setSelectedRoomId(null); }}
            isSnapEnabled={isSnapEnabled}
          />
        </main>
      </div>

      {isProposalOpen && (
        <ProposalModal 
          rooms={rooms}
          theme={theme}
          watermark={watermark}
          onClose={() => setIsProposalOpen(false)}
        />
      )}

      {isEstimateModalOpen && (
        <EstimateModal 
          rooms={rooms}
          fixtures={fixtures}
          unitPrices={unitPrices}
          watermark={watermark}
          onClose={() => setIsEstimateModalOpen(false)}
        />
      )}

      {isSalesTipsModalOpen && (
        <SalesTipsModal
          theme={theme}
          rooms={rooms}
          fixtures={fixtures}
          onClose={() => setIsSalesTipsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
