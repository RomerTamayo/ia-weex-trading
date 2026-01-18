import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:3000';

const CryptoAnalysis = () => {
  const [selectedCrypto, setSelectedCrypto] = useState('btcusdt');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Nuevo estado para controlar el audio de ElevenLabs
  const [currentAudio, setCurrentAudio] = useState(null);

  const cryptos = [
    { symbol: 'btcusdt', name: 'Bitcoin', ticker: 'BTC' },
    { symbol: 'dashusdt', name: 'Dash', ticker: 'DASH' },
    { symbol: 'ethusdt', name: 'Ethereum', ticker: 'ETH' }
  ];

  const analyzeCrypto = async () => {
    setIsLoading(true);
    setData(null);
    // Detener audio previo si existe
    if (currentAudio) currentAudio.pause();

    try {
      const response = await fetch(`${API_URL}/api/analyze-crypto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedCrypto })
      });

      const result = await response.json();
      
      if (result.success) {
        setData(result);
        speak(result.aiReport); // Ahora llama a la nueva versión de ElevenLabs
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // NUEVA FUNCIÓN SPEAK: Conecta con el endpoint /api/generate-audio de tu server.js
  const speak = async (text) => {
    console.log('🎙️ Solicitando audio profesional a ElevenLabs vía Backend...');
    setIsSpeaking(true);

    try {
      const response = await fetch(`${API_URL}/api/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Error al generar el audio');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      setCurrentAudio(audio);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (error) {
      console.error('❌ Error de voz:', error);
      setIsSpeaking(false);
      alert('No se pudo reproducir el audio de ElevenLabs');
    }
  };

  // NUEVA FUNCIÓN STOPSPEAKING: Para detener el objeto Audio
  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: 'white', textAlign: 'center', fontSize: '2.5rem', marginBottom: '30px' }}>
          Crypto AI Assistant 🤖
        </h1>
        
        {/* Botón de prueba actualizado */}
        <button 
          onClick={() => speak('Hola, probando la voz profesional de ElevenLabs desde el servidor')}
          style={{ marginBottom: '20px', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
        >
          🔊 Probar Voz Profesional
        </button>

        {/* Selector de Crypto */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px' }}>
          {cryptos.map(crypto => (
            <button
              key={crypto.symbol}
              onClick={() => setSelectedCrypto(crypto.symbol)}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '12px',
                border: selectedCrypto === crypto.symbol ? '3px solid #3B82F6' : '2px solid rgba(255,255,255,0.3)',
                background: selectedCrypto === crypto.symbol ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {crypto.ticker}
            </button>
          ))}
        </div>

        {/* Botón Analizar */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button
            onClick={analyzeCrypto}
            disabled={isLoading || isSpeaking}
            style={{
              padding: '18px 40px',
              fontSize: '20px',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: 'none',
              background: isLoading ? '#6B7280' : '#3B82F6',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginRight: '15px'
            }}
          >
            {isLoading ? '⏳ Analizando...' : '🎯 Generar Análisis'}
          </button>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              style={{
                padding: '18px 40px',
                fontSize: '20px',
                fontWeight: 'bold',
                borderRadius: '12px',
                border: 'none',
                background: '#EF4444',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              ⏹️ Detener Voz
            </button>
          )}
        </div>

        {/* Datos */}
        {data && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Precio Actual */}
            <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <h2 style={{ color: '#10B981', margin: '0 0 15px 0' }}>💰 Precio Actual</h2>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10B981' }}>
                ${data.priceData.currentPrice.toFixed(2)}
              </div>
              
              <div style={{ fontSize: '1.5rem', color: data.priceData.changePercent24h >= 0 ? '#10B981' : '#EF4444', marginTop: '10px' }}>
                {data.priceData.changePercent24h >= 0 ? '▲' : '▼'} {Math.abs(data.priceData.changePercent24h).toFixed(2)}% (24h)
              </div>
              <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.7)' }}>
                <div>Máx 24h: ${data.priceData.high24h.toFixed(2)}</div>
                <div>Mín 24h: ${data.priceData.low24h.toFixed(2)}</div>
              </div>
            </div>

            {/* Gráfico 15 días */}
            <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(59,130,246,0.3)' }}>
              <h2 style={{ color: '#3B82F6', margin: '0 0 15px 0' }}>📈 Tendencia 15 Días</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.historical.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ background: '#1E3A8A', border: 'none', borderRadius: '8px', color: 'white' }}
                  />
                  <Line type="monotone" dataKey="close" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '15px', fontSize: '1.2rem', color: data.historical.change15d >= 0 ? '#10B981' : '#EF4444' }}>
                {data.historical.trend}: {data.historical.change15d >= 0 ? '+' : ''}{data.historical.change15d}%
              </div>
            </div>

            {/* Libro de Órdenes */}
            <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(139,92,246,0.3)' }}>
              <h2 style={{ color: '#8B5CF6', margin: '0 0 15px 0' }}>📊 Libro de Órdenes</h2>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'white' }}>
                  <span>Compra</span>
                  <span>{data.orderBook.buyPressure}%</span>
                </div>
                <div style={{ height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${data.orderBook.buyPressure}%`, background: '#10B981', transition: 'width 0.5s' }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'white' }}>
                  <span>Venta</span>
                  <span>{data.orderBook.sellPressure}%</span>
                </div>
                <div style={{ height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${data.orderBook.sellPressure}%`, background: '#EF4444', transition: 'width 0.5s' }}></div>
                </div>
              </div>

              <div style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px' }}>
                <strong>Sentimiento:</strong> {data.orderBook.sentiment}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                {data.orderBook.interpretation}
              </div>
            </div>

            {/* Análisis IA */}
            <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(245,158,11,0.3)' }}>
              <h2 style={{ color: '#F59E0B', margin: '0 0 15px 0' }}>🤖 Análisis IA</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: '1.6' }}>
                {data.aiReport}
              </p>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoAnalysis;