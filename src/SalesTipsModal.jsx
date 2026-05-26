import React from 'react';

const SalesTipsModal = ({ theme, rooms, fixtures, onClose }) => {
  let kitchenCount = 0, toiletCount = 0;
  fixtures.forEach(f => {
    if (f.type === 'kitchen') kitchenCount++;
    if (f.type === 'toilet') toiletCount++;
  });
  
  const hasUB = rooms.some(r => r.name.includes('UB') || r.name.includes('風呂'));
  const hasWashroom = rooms.some(r => r.name.includes('洗面'));

  // テーマ別の提案ポイント
  const themeTips = {
    natural: {
      title: '🌿 ナチュラルテイストの提案ポイント',
      tips: [
        '木目の温かみを感じられるリラックス空間であることを強調しましょう。',
        'どんな家具（特に無印良品やIKEAなどの定番家具）とも合わせやすい点が最大のメリットです。',
        '「観葉植物を少し置くだけで、グッとカフェのような雰囲気になりますよ」と伝えると響きます。'
      ]
    },
    pop: {
      title: '🎨 ポップテイストの提案ポイント',
      tips: [
        '遊び心のあるカラーリングで、毎日の生活が楽しくなる空間であることをアピールしましょう。',
        '他の物件にはない「個性」があるため、若い世代や単身者に非常に刺さりやすいです。',
        '「クッションや小物の色を壁紙に合わせると、インテリア上級者の部屋になりますよ」とアドバイスを添えてみてください。'
      ]
    },
    mono: {
      title: '🏢 モノトーンテイストの提案ポイント',
      tips: [
        'まるでホテルのような、洗練されたスタイリッシュな空間であることを強調しましょう。',
        '汚れが目立ちにくく、スッキリとした清潔感を保ちやすい点が実用的なメリットです。',
        'アイアン素材の家具や、ガラステーブルなど都会的なインテリアとの相性の良さをアピールしてください。'
      ]
    }
  };

  const currentTheme = themeTips[theme] || themeTips['natural'];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        width: '90%', maxWidth: '500px', 
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333' }}>
          💡 営業・提案のコツ
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          選択中のテーマや間取りに合わせて、お客様へアピールする際のポイントをまとめました。
        </p>

        <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #4CAF50' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#2e7d32' }}>{currentTheme.title}</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#444' }}>
            {currentTheme.tips.map((tip, idx) => (
              <li key={idx} style={{ marginBottom: '8px', lineHeight: '1.4' }}>{tip}</li>
            ))}
          </ul>
        </div>

        {(hasUB || kitchenCount > 0 || toiletCount > 0) && (
          <div style={{ backgroundColor: '#fff3e0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #ff9800' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#e65100' }}>✨ 設備の強力なアピールポイント</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#444' }}>
              {kitchenCount > 0 && (
                <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>
                  <strong>新品キッチン:</strong> 「毎日使うキッチンが新品だと、お料理のモチベーションが全然違います！」と清潔感・機能性を伝えましょう。
                </li>
              )}
              {hasUB && (
                <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>
                  <strong>新品ユニットバス:</strong> 水回りの新しさは入居決定の最大の決め手になります。「1日の疲れを癒やすピカピカのお風呂」を強調してください。
                </li>
              )}
              {toiletCount > 0 && (
                <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>
                  <strong>温水洗浄便座:</strong> 今や必須の設備。「もちろん最新の温水洗浄便座がついています」と安心感を与えましょう。
                </li>
              )}
            </ul>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button onClick={onClose} style={{ 
            padding: '0.75rem 2rem', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '2rem', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '1rem',
            boxShadow: '0 4px 6px rgba(0,123,255,0.2)'
          }}>
            確認しました
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesTipsModal;
