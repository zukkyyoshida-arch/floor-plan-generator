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
  };

  const handleAddFixture = (type, defaultW) => {
    const newFixture = {
      id: `fixture_${Date.now()}`,
      type,
      w: defaultW,
      x: 0,
      y: 0,
      rotation: 0
    };
    const newFixtures = [...fixtures, newFixture];
    setFixtures(newFixtures);
    setSelectedRoomId(null);
    saveHistory(rooms, newFixtures);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '1rem', backgroundColor: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Floor Plan Generator MVP</h1>
          <span style={{ backgroundColor: '#555', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.9rem' }}>
            総床面積: {totalSqm.toFixed(2)}㎡ ({(totalSqm / 1.62).toFixed(1)}帖)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={undo} disabled={historyIndex === 0} style={{ cursor: 'pointer', padding: '0.25rem 0.5rem' }}>↩️</button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} style={{ cursor: 'pointer', padding: '0.25rem 0.5rem' }}>↪️</button>
          
          <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleLoadJson} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '0.5rem' }}
          >
            📂 開く
          </button>
          <button 
            onClick={handleSaveJson}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            💾 保存
          </button>
          
          <button 
            onClick={handleExport}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '0.5rem' }}
          >
            🎨 SVG出力
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: '280px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
          {/* Settings Area */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #ddd', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>テーマカラー</label>
              <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%', padding: '0.25rem', marginTop: '0.25rem' }}>
                <option value="pop">ポップ（カラー）</option>
                <option value="mono">白黒（青焼き・CAD風）</option>
                <option value="natural">ナチュラル（木目・アース調）</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>面積の一括再計算</label>
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                <button onClick={() => handleRecalculateArea('sqm')} style={{ flex: 1, padding: '0.25rem' }}>㎡表記</button>
                <button onClick={() => handleRecalculateArea('jo')} style={{ flex: 1, padding: '0.25rem' }}>帖表記</button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>透かし文字（ロゴ）</label>
              <input type="text" value={watermark} onChange={e => setWatermark(e.target.value)} style={{ width: '100%', padding: '0.25rem', boxSizing: 'border-box' }} />
            </div>
          </div>
          
          <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>部屋を追加</h3>
            {paletteItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleAddRoom(item.name, item.w, item.h)}
                style={{
                  padding: '0.75rem', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '6px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ width: '20px', height: '20px', backgroundColor: item.color, border: '1px solid black' }}></div>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>{item.w} x {item.h}</span>
                </div>
              </button>
            ))}
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
          <div style={{ padding: '1rem', borderTop: '1px solid #ddd', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedRoomId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>部屋名:</label>
                <input 
                  type="text" 
                  value={rooms.find(r => r.id === selectedRoomId)?.name || ''}
                  onChange={(e) => {
                    const newRooms = rooms.map(r => r.id === selectedRoomId ? { ...r, name: e.target.value } : r);
                    setRooms(newRooms);
                    // text edit is not pushing to history immediately to avoid lag, but this is fine for MVP
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
                  style={{ padding: '0.5rem', cursor: 'pointer' }}
                >
                  🔄 90度回転 (Rキー)
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
              🗑️ 選択中のパーツを削除
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, backgroundColor: '#e0e0e0', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
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
