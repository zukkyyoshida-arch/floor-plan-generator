import React, { useMemo } from 'react';
import { generateEstimateItems } from './estimateLogic';

const EstimateModal = ({ rooms, fixtures, unitPrices, watermark, onClose }) => {
  const items = useMemo(() => generateEstimateItems(rooms, fixtures, unitPrices), [rooms, fixtures, unitPrices]);
  
  const subTotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const tax = Math.round(subTotal * 0.1);
  const grandTotal = subTotal + tax;

  const handlePrint = () => {
    window.print();
  };

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
          }
          .no-print {
            display: none !important;
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
        backgroundColor: 'white', 
        width: '100%', maxWidth: '210mm', 
        minHeight: '297mm',
        margin: '0 auto', 
        padding: '20mm', 
        boxSizing: 'border-box',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        display: 'block',
        fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
          <h1 style={{ margin: 0, fontSize: '24px', border: '1px solid #333', display: 'inline-block', padding: '10px 80px', letterSpacing: '0.5em', fontWeight: 'normal' }}>御 見 積 書</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ flex: 1.5, borderBottom: '1px solid #333', paddingBottom: '5px', fontSize: '16px', alignSelf: 'flex-end' }}>
            <span style={{ fontSize: '12px' }}>御中</span><br/>
            〇〇様邸 リノベーション工事
          </div>
          <div style={{ flex: 1, textAlign: 'right', fontSize: '12px' }}>
            <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}><span>御見積日</span><span>{new Date().toLocaleDateString('ja-JP')}</span></div>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}><span>有効期限</span><span>見積日より1ヶ月</span></div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{watermark}</div>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '2px solid #333', paddingBottom: '5px', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>税込合計金額</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', marginLeft: '40px' }}>¥{grandTotal.toLocaleString()}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '8px', textAlign: 'left', width: '40%' }}>工事名</th>
              <th style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '8px', textAlign: 'center', width: '10%' }}>数量</th>
              <th style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '8px', textAlign: 'center', width: '10%' }}>単位</th>
              <th style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '8px', textAlign: 'right', width: '15%' }}>単価</th>
              <th style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '8px', textAlign: 'right', width: '15%' }}>金額</th>
              <th style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '8px', textAlign: 'left', width: '10%' }}>備考</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ borderBottom: '1px dotted #999', padding: '8px' }}>{item.name}</td>
                <td style={{ borderBottom: '1px dotted #999', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                <td style={{ borderBottom: '1px dotted #999', padding: '8px', textAlign: 'center' }}>{item.unit}</td>
                <td style={{ borderBottom: '1px dotted #999', padding: '8px', textAlign: 'right' }}>{item.price.toLocaleString()}</td>
                <td style={{ borderBottom: '1px dotted #999', padding: '8px', textAlign: 'right' }}>{(item.qty * item.price).toLocaleString()}</td>
                <td style={{ borderBottom: '1px dotted #999', padding: '8px' }}></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', fontSize: '13px', pageBreakInside: 'avoid' }}>
          <div style={{ width: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px dotted #999' }}>
              <span>【 合 計 】</span>
              <span>{subTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px dotted #999' }}>
              <span>【 消費税 】</span>
              <span>{tax.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '2px solid #333', fontWeight: 'bold' }}>
              <span>【 総合計 】</span>
              <span>{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateModal;
