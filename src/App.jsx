import React, { useState, useEffect, useRef } from 'react';
import FloorPlanViewer from './FloorPlanViewer';
import { sampleFloorPlan } from './data';

function App() {
  const fileInputRef = useRef(null);
  const [rooms, setRooms] = useState(sampleFloorPlan.rooms);
  const [fixtures, setFixtures] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);
  
  const [theme, setTheme] = useState('pop'); // pop, mono, natural
  const [watermark, setWatermark] = useState('〇〇内装株式会社');
  
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
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
  }, [selectedRoomId, selectedFixtureId, history, historyIndex, rooms, fixtures]);

  const handleRoomUpdate = (id, newX, newY) => {
    const newRooms = rooms.map(r => r.id === id ? { ...r, x: newX, y: newY } : r);
    setRooms(newRooms);
    saveHistory(newRooms, fixtures);
  };

  const handleFixtureUpdate = (id, newX, newY) => {
    const newFixtures = fixtures.map(f => f.id === id ? { ...f, x: newX, y: newY } : f);
    setFixtures(newFixtures);
    saveHistory(rooms, newFixtures);
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

  const handleSaveJson = () => {
    const data = { rooms, fixtures, theme, watermark };
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
        saveHistory(data.rooms || [], data.fixtures || []);
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalSqm = rooms.reduce((sum, r) => sum + ((r.w / 1000) * (r.h / 1000)), 0);

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
      <div style={{ padding: '1rem', borderBottom: '1px solid #ddd', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>テーマカラー</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%', padding: '0.4rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="pop">ポップ（カラー）</option>
            <option value="mono">白黒（青焼き・CAD風）</option>
            <option value="natural">ナチュラル（木目・アース調）</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>面積の一括再計算</label>
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
            <button onClick={() => handleRecalculateArea('sqm')} style={{ flex: 1, padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>㎡</button>
            <button onClick={() => handleRecalculateArea('jo')} style={{ flex: 1, padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>帖</button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>透かし文字（ロゴ）</label>
          <input type="text" value={watermark} onChange={e => setWatermark(e.target.value)} style={{ width: '100%', padding: '0.4rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginTop: '0.25rem' }} />
        </div>
      </div>
      
      {/* Palette Area */}
      <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>部屋を追加</h3>
        <div style={{ display: isMobile ? 'grid' : 'flex', gridTemplateColumns: isMobile ? '1fr 1fr' : 'none', flexDirection: isMobile ? 'row' : 'column', gap: '0.5rem' }}>
          {paletteItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleAddRoom(item.name, item.w, item.h)}
              style={{
                padding: '0.75rem', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '6px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ width: '20px', height: '20px', backgroundColor: item.color, border: '1px solid black', flexShrink: 0 }}></div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</span>
              </div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: '1rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>建具・家具スタンプ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button onClick={() => handleAddFixture('door_single', 900)} style={{ padding: '0.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>🚪 ドア</button>
            <button onClick={() => handleAddFixture('window', 1800)} style={{ padding: '0.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>🪟 窓</button>
            <button onClick={() => handleAddFixture('kitchen', 2500)} style={{ padding: '0.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>🍳 キッチン</button>
            <button onClick={() => handleAddFixture('toilet', 800)} style={{ padding: '0.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>🚽 トイレ</button>
            <button onClick={() => handleAddFixture('bed', 1200)} style={{ padding: '0.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>🛏️ ベッド</button>
            <button onClick={() => handleAddFixture('sofa', 1800)} style={{ padding: '0.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>🛋️ ソファ</button>
          </div>
        </div>
      </div>

      {/* Delete & Edit Area */}
      <div style={{ padding: '1rem', borderTop: '1px solid #ddd', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 20px)' : '1rem' }}>
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
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.5rem' }}>面積表示:</label>
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
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>建具が選択されています</p>
            <button 
              onClick={() => {
                const newFixtures = fixtures.map(f => f.id === selectedFixtureId ? { ...f, rotation: (f.rotation + 90) % 360 } : f);
                setFixtures(newFixtures);
                saveHistory(rooms, newFixtures);
              }}
              style={{ padding: '0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              🔄 90度回転
            </button>
          </div>
        )}

        {!selectedRoomId && !selectedFixtureId && (
          <p style={{ fontSize: '0.85rem', color: '#888', textAlign: 'center', margin: 0 }}>パーツを選択すると編集できます</p>
        )}

        <button
          onClick={handleDelete}
          disabled={!selectedRoomId && !selectedFixtureId}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: (selectedRoomId || selectedFixtureId) ? '#ff4c4c' : '#e0e0e0',
            color: (selectedRoomId || selectedFixtureId) ? 'white' : '#888',
            border: 'none',
            borderRadius: '4px',
            cursor: (selectedRoomId || selectedFixtureId) ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            marginTop: '0.5rem'
          }}
        >
          🗑️ 削除
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '1rem', backgroundColor: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>Floor Plan</h1>
          <span style={{ backgroundColor: '#555', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
            {totalSqm.toFixed(1)}㎡ / {(totalSqm / 1.62).toFixed(1)}帖
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <button onClick={undo} disabled={historyIndex === 0} style={{ cursor: 'pointer', padding: '0.5rem', borderRadius: '4px', border: 'none' }}>↩️</button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} style={{ cursor: 'pointer', padding: '0.5rem', borderRadius: '4px', border: 'none' }}>↪️</button>
          
          <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleLoadJson} />
          {!isMobile && (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '0.5rem' }}
              >
                📂
              </button>
              <button 
                onClick={handleSaveJson}
                style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                💾
              </button>
            </>
          )}
          <button 
            onClick={handleExport}
            style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 'bold' }}
          >
            SVG出力
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside style={{ width: '320px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
            <SidebarContent />
          </aside>
        )}

        {/* Mobile Bottom Tray */}
        {isMobile && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #ddd',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
            transform: isTrayOpen ? 'translateY(0)' : 'translateY(calc(100% - 60px))',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            height: '75vh',
            maxHeight: '600px'
          }}>
            <button 
              onClick={() => setIsTrayOpen(!isTrayOpen)}
              style={{ 
                height: '60px', 
                backgroundColor: 'white', 
                border: 'none', 
                borderBottom: '1px solid #ddd', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                cursor: 'pointer',
                flexShrink: 0,
                borderRadius: '16px 16px 0 0',
                padding: '0 1rem'
              }}
            >
              <div style={{ width: '40px', height: '6px', backgroundColor: '#ccc', borderRadius: '3px' }}></div>
              <span style={{ position: 'absolute', right: '1rem', fontWeight: 'bold', color: '#007bff' }}>
                {isTrayOpen ? '閉じる' : 'メニューを開く'}
              </span>
            </button>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <SidebarContent />
              
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
            </div>
          </div>
        )}

        <main style={{ flex: 1, backgroundColor: '#e0e0e0', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', paddingBottom: isMobile && !isTrayOpen ? '60px' : 0, touchAction: 'none' }}>
          <FloorPlanViewer 
            data={currentData} 
            onRoomUpdate={handleRoomUpdate} 
            onFixtureUpdate={handleFixtureUpdate}
            selectedRoomId={selectedRoomId}
            onSelectRoom={(id) => { setSelectedRoomId(id); setSelectedFixtureId(null); }}
            selectedFixtureId={selectedFixtureId}
            onSelectFixture={(id) => { setSelectedFixtureId(id); setSelectedRoomId(null); }}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
