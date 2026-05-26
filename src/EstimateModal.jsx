import React, { useMemo, useState, useEffect } from 'react';
import { generateEstimateItems } from './estimateLogic';

const EstimateModal = ({ rooms, fixtures, unitPrices, watermark, onClose }) => {
  const [svgContent, setSvgContent] = useState('');
  const items = useMemo(() => generateEstimateItems(rooms, fixtures, unitPrices), [rooms, fixtures, unitPrices]);
  
  const subTotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const tax = Math.round(subTotal * 0.1);
  const grandTotal = subTotal + tax;

  useEffect(() => {
    const svgElement = document.querySelector('main svg');
    if (svgElement) {
      const serializer = new XMLSerializer();
      setSvgContent(serializer.serializeToString(svgElement));
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('ja-JP');

  return (
    <div className="estimate-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      padding: '2rem', overflowY: 'auto'
    }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            display: none !important;
          }
          .estimate-modal-overlay,
          .estimate-modal-overlay * {
            display: revert !important;
          }
          .estimate-modal-overlay {
            position: static !important;
            padding: 0 !important;
            background: none !important;
            overflow: visible !important;
            height: auto !important;
          }
          .estimate-print-area {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', width: '100%', maxWidth: '210mm', margin: '0 auto 1rem auto' }}>
        <button onClick={handlePrint} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>📄 PDFとして保存 (印刷)</button>
        <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>✖ 閉じる</button>
      </div>

      <div className="estimate-print-area" style={{ 
        width: '100%', maxWidth: '210mm', 
        margin: '0 auto', 
        fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
        color: '#000'
      }}>
        
        {/* === PAGE 1: 表紙 & 図面 === */}
        <div style={{ 
          backgroundColor: 'white', 
          minHeight: '297mm',
          padding: '20mm', 
          boxSizing: 'border-box',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          marginBottom: '20px'
        }}>
          {/* Header Title */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ 
              margin: 0, fontSize: '22px', border: '1px solid #000', 
              display: 'inline-block', padding: '8px 60px', 
              letterSpacing: '0.8em', fontWeight: 'bold' 
            }}>御見積書</h1>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            {/* Left Area: 宛名・挨拶 */}
            <div style={{ flex: 1.2, paddingRight: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ 
                borderBottom: '1px solid #000', 
                paddingBottom: '5px', 
                marginBottom: '15px',
                fontSize: '18px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'flex-end'
              }}>
                <span style={{ flex: 1 }}>〇〇 様邸 リノベーション工事</span>
                <span style={{ fontSize: '14px', marginLeft: '10px' }}>御中</span>
              </div>
              <div style={{ fontSize: '14px' }}>下記の通り御見積り申し上げます。</div>
            </div>

            {/* Right Area: 情報 */}
            <div style={{ flex: 0.8, fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <div style={{ border: '1px solid #000', padding: '10px', width: '100%', textAlign: 'center', color: '#666', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  [ 自社情報・印鑑スペース ]
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ width: '80px' }}>伝票No</span>
                <span>_______________</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ width: '80px' }}>御見積日</span>
                <span>{today}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ width: '80px' }}>有効期限</span>
                <span>見積日より1ヶ月</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ width: '80px' }}>取引方法</span>
                <span>現金振込</span>
              </div>
              <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                {watermark}
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '3px double #000', 
            paddingBottom: '10px', 
            marginBottom: '30px',
            alignItems: 'flex-end'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', width: '120px' }}>税込合計金額</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '2px', marginLeft: '20px' }}>¥{grandTotal.toLocaleString()} -</div>
          </div>

          {/* Diagram Area */}
          <div style={{ 
            border: '2px solid #333', 
            padding: '10px', 
            height: '140mm', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '10px', textAlign: 'center' }}>
              【 改修平面図 】
            </div>
            <div 
              style={{ flex: 1, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        </div>

        {/* === PAGE 2+: 明細表 === */}
        <div className="page-break" style={{ 
          backgroundColor: 'white', 
          minHeight: '297mm',
          padding: '20mm', 
          boxSizing: 'border-box',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center', letterSpacing: '0.2em' }}>
            御見積明細書
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '2px solid #000' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '35%' }}>工事名</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '10%' }}>数量</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '10%' }}>単位</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%' }}>単価</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%' }}>金額</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%' }}>備考</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{item.name}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.qty}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{item.unit}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.price.toLocaleString()}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{(item.qty * item.price).toLocaleString()}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}></td>
                </tr>
              ))}
              
              {/* 空白行で埋める（オプション） */}
              {Array.from({ length: Math.max(0, 15 - items.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ border: '1px solid #000', padding: '14px 8px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '14px 8px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '14px 8px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '14px 8px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '14px 8px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '14px 8px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', fontSize: '13px', pageBreakInside: 'avoid' }}>
            <table style={{ width: '300px', borderCollapse: 'collapse', border: '2px solid #000' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', backgroundColor: '#f5f5f5', width: '40%' }}>合 計</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{subTotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>消費税</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{tax.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>総 合 計</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>{grandTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EstimateModal;
