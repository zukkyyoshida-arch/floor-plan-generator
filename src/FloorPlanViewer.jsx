import React, { useState, useRef, useMemo } from 'react';
import polygonClipping from 'polygon-clipping';

const FloorPlanViewer = ({ 
  data, 
  onRoomUpdate, 
  onFixtureUpdate,
  selectedRoomId, 
  onSelectRoom,
  selectedFixtureId,
  onSelectFixture
}) => {
  const { rooms, fixtures } = data;
  const svgRef = useRef(null);
  
  // Dragging state
  const [draggingId, setDraggingId] = useState(null);
  const [dragType, setDragType] = useState(null); // 'room' or 'fixture'
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPos, setPreviewPos] = useState(null); 

  const gridSize = 500;

  const getMousePosition = (evt) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    const pt = svg.createSVGPoint();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(CTM.inverse());
  };

  const handlePointerDown = (evt, item, type) => {
    evt.preventDefault();
    evt.stopPropagation();
    if (type === 'room' && onSelectRoom) onSelectRoom(item.id);
    if (type === 'fixture' && onSelectFixture) onSelectFixture(item.id);

    const pos = getMousePosition(evt);
    setDraggingId(item.id);
    setDragType(type);
    setDragOffset({
      x: pos.x - item.x,
      y: pos.y - item.y
    });
    setPreviewPos({ x: item.x, y: item.y });
  };

  const handleSvgPointerDown = () => {
    if (onSelectRoom) onSelectRoom(null);
    if (onSelectFixture) onSelectFixture(null);
  };

  const handlePointerMove = (evt) => {
    if (!draggingId) return;
    evt.preventDefault();
    const pos = getMousePosition(evt);
    
    const newX = pos.x - dragOffset.x;
    const newY = pos.y - dragOffset.y;
    setPreviewPos({ x: newX, y: newY });
  };

  const handlePointerUp = (evt) => {
    if (!draggingId) return;
    evt.preventDefault();
    
    if (previewPos) {
      const snapSize = dragType === 'fixture' ? 100 : gridSize;
      const snappedX = Math.round(previewPos.x / snapSize) * snapSize;
      const snappedY = Math.round(previewPos.y / snapSize) * snapSize;
      
      if (dragType === 'room' && onRoomUpdate) {
        onRoomUpdate(draggingId, snappedX, snappedY);
      } else if (dragType === 'fixture' && onFixtureUpdate) {
        onFixtureUpdate(draggingId, snappedX, snappedY);
      }
    }
    
    setDraggingId(null);
    setDragType(null);
    setPreviewPos(null);
  };

  const currentRooms = useMemo(() => {
    return rooms.map(room => {
      if (room.id === draggingId && dragType === 'room' && previewPos) {
        return { ...room, x: previewPos.x, y: previewPos.y };
      }
      return room;
    });
  }, [rooms, draggingId, dragType, previewPos]);

  const currentFixtures = useMemo(() => {
    return fixtures.map(f => {
      if (f.id === draggingId && dragType === 'fixture' && previewPos) {
        return { ...f, x: previewPos.x, y: previewPos.y };
      }
      return f;
    });
  }, [fixtures, draggingId, dragType, previewPos]);

  const { outerPath, minX, maxX, minY, maxY } = useMemo(() => {
    if (currentRooms.length === 0) return { outerPath: '', minX: 0, maxX: 10000, minY: 0, maxY: 10000 };
    
    const polys = currentRooms.map(r => [[
      [r.x, r.y],
      [r.x + r.w, r.y],
      [r.x + r.w, r.y + r.h],
      [r.x, r.y + r.h]
    ]]);
    
    let path = '';
    let mix = Infinity, mx = -Infinity, miy = Infinity, my = -Infinity;
    
    currentRooms.forEach(r => {
      if (r.x < mix) mix = r.x;
      if (r.x + r.w > mx) mx = r.x + r.w;
      if (r.y < miy) miy = r.y;
      if (r.y + r.h > my) my = r.y + r.h;
    });

    try {
      const union = polygonClipping.union(...polys);
      union.forEach(multiPoly => {
        multiPoly.forEach(ring => {
          ring.forEach((pt, i) => {
            path += i === 0 ? `M ${pt[0]} ${pt[1]} ` : `L ${pt[0]} ${pt[1]} `;
          });
          path += 'Z ';
        });
      });
    } catch (e) {
      console.error('Polygon clipping error', e);
    }
    
    return { outerPath: path, minX: mix, maxX: mx, minY: miy, maxY: my };
  }, [currentRooms]);

  const PADDING = 2000;
  const vBoxX = minX - PADDING;
  const vBoxY = minY - PADDING;
  const vBoxW = (maxX - minX) + PADDING * 2;
  const vBoxH = (maxY - minY) + PADDING * 2;

  // Render Grid lines spanning the bounding box
  const gridLines = [];
  const startX = Math.floor(vBoxX / gridSize) * gridSize;
  const startY = Math.floor(vBoxY / gridSize) * gridSize;
  for (let x = startX; x <= vBoxX + vBoxW; x += gridSize) {
    gridLines.push(<line key={`v-${x}`} x1={x} y1={vBoxY} x2={x} y2={vBoxY + vBoxH} stroke="#e0e0e0" strokeWidth="5" />);
  }
  for (let y = startY; y <= vBoxY + vBoxH; y += gridSize) {
    gridLines.push(<line key={`h-${y}`} x1={vBoxX} y1={y} x2={vBoxX + vBoxW} y2={y} stroke="#e0e0e0" strokeWidth="5" />);
  }

  const getRoomColor = (name, theme) => {
    if (theme === 'mono') return '#ffffff';
    if (theme === 'natural') {
      if (name.includes('LDK') || name.includes('リビング')) return '#f5deb3';
      if (name.includes('洋室') || name.includes('寝室')) return '#fdf5e6';
      if (name.includes('和室')) return '#dcd8c0';
      if (name.includes('トイレ') || name.includes('UB') || name.includes('風呂')) return '#e0f7fa';
      return '#fafafa';
    }
    // pop (default)
    if (name.includes('LDK') || name.includes('リビング')) return '#fff3e0';
    if (name.includes('洋室') || name.includes('寝室')) return '#e3f2fd';
    if (name.includes('和室')) return '#e8f5e9';
    if (name.includes('トイレ') || name.includes('UB') || name.includes('風呂')) return '#f3e5f5';
    if (name.includes('クローゼット') || name.includes('収納')) return '#efebe9';
    return '#fafafa';
  };

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg 
        ref={svgRef}
        viewBox={`${vBoxX} ${vBoxY} ${vBoxW} ${vBoxH}`} 
        style={{ width: '100%', height: '100%', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: draggingId ? 'grabbing' : 'default' }}
        onMouseDown={handleSvgPointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <defs>
          <marker id="arrow" markerWidth="20" markerHeight="20" refX="10" refY="10" orient="auto-start-reverse">
            <path d="M 0 0 L 20 10 L 0 20 z" fill="#ff4c4c" />
          </marker>
        </defs>

        <g className="grid">
          {gridLines}
        </g>

        {/* 1. Room Fills (背景) */}
        <g className="room-fills">
          {currentRooms.map(room => (
            <rect 
              key={`fill-${room.id}`}
              x={room.x} 
              y={room.y} 
              width={room.w} 
              height={room.h} 
              fill={selectedRoomId === room.id ? '#fff59d' : getRoomColor(room.name, data.theme || 'pop')} 
            />
          ))}
        </g>

        {/* 2. Outer Wall (外枠を太く描画) */}
        {outerPath && (
          <path d={outerPath} fill="none" stroke="black" strokeWidth="80" strokeLinejoin="miter" />
        )}

        {/* 3. Room Inner Strokes (内壁線) */}
        <g className="room-strokes">
          {currentRooms.map(room => (
            <rect 
              key={`stroke-${room.id}`}
              x={room.x} 
              y={room.y} 
              width={room.w} 
              height={room.h} 
              fill="none"
              stroke={selectedRoomId === room.id ? '#ff4c4c' : 'black'} 
              strokeWidth={selectedRoomId === room.id ? "60" : "40"}
              strokeLinejoin="miter"
            />
          ))}
        </g>

        {/* 4. Room Text & Interactions */}
        <g className="room-interactions">
          {currentRooms.map(room => (
            <g 
              key={`interact-${room.id}`}
              onMouseDown={(e) => handlePointerDown(e, room, 'room')}
              onTouchStart={(e) => handlePointerDown(e, room, 'room')}
              style={{ cursor: draggingId === room.id ? 'grabbing' : 'grab' }}
            >
              <rect x={room.x} y={room.y} width={room.w} height={room.h} fill="transparent" />

              <text x={room.x + room.w / 2} y={room.y + room.h / 2 - 50} fontSize="180" textAnchor="middle" fill="black" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                {room.name}
              </text>
              <text x={room.x + room.w / 2} y={room.y + room.h / 2 + 150} fontSize="160" textAnchor="middle" fill="black" style={{ pointerEvents: 'none' }}>
                {room.area}
              </text>

              {selectedRoomId === room.id && (
                <g style={{ pointerEvents: 'none' }}>
                  <line x1={room.x + 150} y1={room.y + 250} x2={room.x + room.w - 150} y2={room.y + 250} stroke="#ff4c4c" strokeWidth="15" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={room.x + room.w / 2} y={room.y + 200} fill="#ff4c4c" fontSize="150" fontWeight="bold" textAnchor="middle">{Math.round(room.w).toLocaleString()}</text>

                  <line x1={room.x + 250} y1={room.y + 150} x2={room.x + 250} y2={room.y + room.h - 150} stroke="#ff4c4c" strokeWidth="15" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={room.x + 180} y={room.y + room.h / 2} fill="#ff4c4c" fontSize="150" fontWeight="bold" textAnchor="middle" transform={`rotate(-90 ${room.x + 180} ${room.y + room.h / 2})`}>{Math.round(room.h).toLocaleString()}</text>
                </g>
              )}
            </g>
          ))}
        </g>

        {/* 5. Fixtures */}
        <g className="fixtures">
          {currentFixtures.map(f => (
            <g 
              key={f.id}
              transform={`translate(${f.x}, ${f.y}) rotate(${f.rotation})`}
              onMouseDown={(e) => handlePointerDown(e, f, 'fixture')}
              onTouchStart={(e) => handlePointerDown(e, f, 'fixture')}
              style={{ cursor: draggingId === f.id ? 'grabbing' : 'grab' }}
            >
              {selectedFixtureId === f.id && (
                <rect 
                  x="-50" 
                  y={f.type === 'door_single' ? -50 : (f.type === 'kitchen' ? -375 : (f.type === 'toilet' ? -450 : (f.type === 'bed' || f.type === 'sofa' ? -f.w/2 - 50 : -80)))} 
                  width={f.type === 'toilet' ? 900 : (f.type === 'bed' ? 2100 : (f.type === 'sofa' ? 900 : f.w + 100))} 
                  height={f.type === 'door_single' ? f.w + 100 : (f.type === 'kitchen' ? 750 : (f.type === 'toilet' ? 900 : (f.type === 'bed' || f.type === 'sofa' ? f.w + 100 : 160)))} 
                  fill="none" stroke="#ff4c4c" strokeWidth="20" strokeDasharray="40 20" 
                />
              )}
              
              {f.type === 'door_single' && (
                <g>
                  <path d={`M 0 0 A ${f.w} ${f.w} 0 0 1 ${f.w} ${f.w}`} fill="none" stroke="#666" strokeWidth="10" strokeDasharray="20 20" />
                  <line x1="0" y1="0" x2={f.w} y2="0" stroke="black" strokeWidth="40" />
                  <circle cx="0" cy="0" r="30" fill="black" />
                </g>
              )}
              
              {f.type === 'window' && (
                <g>
                  <rect x="0" y="-30" width={f.w} height="60" fill="white" stroke="black" strokeWidth="15" />
                  <line x1="0" y1="-10" x2={f.w} y2="-10" stroke="#888" strokeWidth="10" />
                  <line x1="0" y1="10" x2={f.w} y2="10" stroke="#888" strokeWidth="10" />
                </g>
              )}

              {f.type === 'kitchen' && (
                <g>
                  <rect x="0" y="-325" width={f.w} height="650" fill="#f0f0f0" stroke="#888" strokeWidth="15" />
                  <rect x="150" y="-225" width="800" height="450" rx="50" fill="#e0e0e0" stroke="#888" strokeWidth="10" />
                  <circle cx={f.w - 300} cy="-100" r="100" fill="#d0d0d0" stroke="#888" strokeWidth="10" />
                  <circle cx={f.w - 300} cy="100" r="100" fill="#d0d0d0" stroke="#888" strokeWidth="10" />
                  <circle cx={f.w - 550} cy="0" r="80" fill="#d0d0d0" stroke="#888" strokeWidth="10" />
                </g>
              )}

              {f.type === 'toilet' && (
                <g>
                  <rect x="0" y="-400" width="800" height="800" rx="100" fill="white" stroke="#ccc" strokeWidth="10" />
                  <rect x="100" y="-300" width="600" height="500" rx="250" fill="white" stroke="#888" strokeWidth="15" />
                  <rect x="50" y="-400" width="700" height="200" rx="50" fill="#f0f0f0" stroke="#888" strokeWidth="15" />
                </g>
              )}

              {f.type === 'bed' && (
                <g>
                  <rect x="0" y={-f.w/2} width="2000" height={f.w} rx="50" fill="#fdfdfd" stroke="#ccc" strokeWidth="15" />
                  <rect x="100" y={-f.w/2 + 100} width="400" height={f.w - 200} rx="100" fill="#f0f0f0" stroke="#bbb" strokeWidth="10" />
                  <line x1="600" y1={-f.w/2} x2="600" y2={f.w/2} stroke="#ccc" strokeWidth="10" strokeDasharray="20 20" />
                </g>
              )}

              {f.type === 'sofa' && (
                <g>
                  <rect x="0" y={-f.w/2} width="800" height={f.w} rx="100" fill="#f0f0f0" stroke="#888" strokeWidth="15" />
                  <rect x="0" y={-f.w/2} width="200" height={f.w} fill="#e0e0e0" stroke="#888" strokeWidth="15" rx="50" />
                  <rect x="0" y={-f.w/2} width="800" height="200" fill="#e0e0e0" stroke="#888" strokeWidth="15" rx="50" />
                  <rect x="0" y={f.w/2 - 200} width="800" height="200" fill="#e0e0e0" stroke="#888" strokeWidth="15" rx="50" />
                </g>
              )}
            </g>
          ))}
        </g>

        {/* 6. Watermark */}
        {data.watermark && (
          <text 
            x={vBoxX + vBoxW - 100} 
            y={vBoxY + vBoxH - 100} 
            fontSize="400" 
            fill="rgba(0,0,0,0.05)" 
            textAnchor="end" 
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {data.watermark}
          </text>
        )}
      </svg>
    </div>
  );
};

export default FloorPlanViewer;
