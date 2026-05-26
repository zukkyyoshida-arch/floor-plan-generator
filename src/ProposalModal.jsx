import React, { useEffect, useState } from 'react';
import { getRecommendedMaterials, getThemeAccents } from './materials';

const ProposalModal = ({ rooms, theme, watermark, onClose }) => {
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    // Clone the main SVG
    const svgElement = document.querySelector('main svg');
    if (svgElement) {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);
      
      // Remove any interactive UI parts from SVG for clean printing (optional, like delete buttons)
      // but here we just take the raw string.
      
      setSvgContent(svgString);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const accents = getThemeAccents(theme);

  return (
    <div className="proposal-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      padding: '2rem', overflowY: 'auto'
    }}>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            display: none !important;
          }
          .proposal-modal-overlay,
          .proposal-modal-overlay * {
            display: revert !important;
          }
          .proposal-modal-overlay {
            position: static !important;
            padding: 0 !important;
            background: none !important;
            overflow: visible !important;
            height: auto !important;
          }
          .proposal-print-area {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          
          /* Style SVG to fit nicely in print */
          .proposal-print-area svg {
            max-width: 100%;
            height: auto;
            max-height: 140mm;
          }
        }
      `}</style>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', width: '100%', maxWidth: '210mm', margin: '0 auto 1rem auto' }}>
        <button onClick={handlePrint} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>📄 PDFとして保存 (印刷)</button>
        <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>✖ 閉じる</button>
      </div>

      <div className="proposal-print-area" style={{ 
        backgroundColor: 'white', 
        width: '100%', maxWidth: '210mm', 
        minHeight: '297mm',
        margin: '0 auto', 
        padding: '15mm', 
        boxSizing: 'border-box',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>仕上げ表 提案書</h1>
          <div style={{ fontSize: '16px', color: '#555', fontWeight: 'bold' }}>{watermark}</div>
        </div>

        <div style={{ display: 'block', width: '100%', overflow: 'hidden' }}>
          {/* Left: Floor Plan */}
          <div style={{ float: 'left', width: '45%', marginRight: '5%', marginBottom: '20px' }}>
            <div 
              style={{ width: '100%', border: '1px solid #eee', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
            {/* Color Swatches */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '15px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', pageBreakInside: 'avoid' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', marginRight: '10px', color: '#555' }}>テーマカラー<br/>(イメージ):</div>
              {accents.map((color, idx) => (
                <div key={idx} style={{ width: '45px', height: '45px', backgroundColor: color, borderRadius: '50%', border: '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
              ))}
            </div>
          </div>

          {/* Right: Table */}
          <div style={{ float: 'left', width: '50%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '2px solid #333', padding: '10px 8px', textAlign: 'left', width: '25%' }}>部屋名</th>
                  <th style={{ borderBottom: '2px solid #333', padding: '10px 8px', textAlign: 'left', width: '15%' }}>箇所</th>
                  <th style={{ borderBottom: '2px solid #333', padding: '10px 8px', textAlign: 'left', width: '20%' }}>メーカー</th>
                  <th style={{ borderBottom: '2px solid #333', padding: '10px 8px', textAlign: 'left', width: '40%' }}>推奨品番</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, idx) => {
                  const mats = getRecommendedMaterials(room.name, theme);
                  return (
                    <React.Fragment key={idx}>
                      <tr>
                        <td rowSpan={4} style={{ borderBottom: '2px solid #aaa', padding: '12px 8px', fontWeight: 'bold', verticalAlign: 'top', fontSize: '14px' }}>
                          {room.name}<br/>
                          <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>{room.area}</span>
                        </td>
                        <td style={{ padding: '8px 8px 4px', color: '#555' }}>壁</td>
                        <td style={{ padding: '8px 8px 4px', color: '#555' }}>サンゲツ</td>
                        <td style={{ padding: '8px 8px 4px', fontWeight: 'bold', backgroundColor: '#fffde7', borderLeft: '4px solid #fdd835' }}>{mats.wall}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 8px', color: '#555' }}>天井</td>
                        <td style={{ padding: '4px 8px', color: '#555' }}>サンゲツ</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold', backgroundColor: '#fffde7', borderLeft: '4px solid #fdd835' }}>{mats.ceiling}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 8px', color: '#555' }}>床</td>
                        <td style={{ padding: '4px 8px', color: '#555' }}>サンゲツ</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold', backgroundColor: '#e0f2f1', borderLeft: '4px solid #26a69a' }}>{mats.floor}</td>
                      </tr>
                      <tr>
                        <td style={{ borderBottom: '2px solid #aaa', padding: '4px 8px 12px', color: '#555' }}>アクセント</td>
                        <td style={{ borderBottom: '2px solid #aaa', padding: '4px 8px 12px', color: '#555' }}>サンゲツ</td>
                        <td style={{ borderBottom: '2px solid #aaa', padding: '4px 8px 12px', fontWeight: 'bold', backgroundColor: '#fce4ec', borderLeft: '4px solid #ec407a' }}>{mats.accent}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            
            <div style={{ marginTop: '30px', padding: '15px', fontSize: '11px', color: '#555', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fafafa', pageBreakInside: 'avoid' }}>
              <strong>【ご提案事項について】</strong><br/>
              ※ 上記品番はご指定のテーマ（{theme}）に基づく推奨プランです。実際の施工にあたっては、実物の見本帳での色合わせ・確認をお願いいたします。<br/>
              ※ 壁・天井クロスはSPシリーズ（量産品）、床材はWDシリーズ（フロアタイル）またはHMシリーズ（クッションフロア）を標準仕様として想定しております。
            </div>
          </div>
          <div style={{ clear: 'both' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ProposalModal;
