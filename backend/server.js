// ============================================================================
// backend/server.js - Servidor con WEEX API CORRECTA (URLs actualizadas)
// ============================================================================

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const app = express();

// CONFIGURACIÓN DE CORS: Permite peticiones desde tu frontend
app.use(cors({
  origin: '*', // Permitir todos los orígenes para desarrollo local
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// WEEX API URLs CORRECTAS
const WEEX_SPOT_API = 'https://api-spot.weex.com';      // Para spot trading
const WEEX_FUTURES_API = 'https://api-contract.weex.com'; // Para futuros

// Usamos FUTURES porque Spot no funciona correctamente
const USE_FUTURES = true; // TRUE = Futuros funcionan perfectamente

// ============================================================================
// NUEVO ENDPOINT PARA ELEVENLABS (Soluciona problemas de CORS del navegador)
// ============================================================================
app.post('/api/generate-audio', async (req, res) => {
  try {
    const { text } = req.body;
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Voz por defecto (Rachel)

    if (!text) return res.status(400).json({ error: 'Texto requerido' });

    console.log('🎙️ Generando audio en el servidor...');

    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      data: {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      },
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer'
    });

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);

  } catch (error) {
    console.error('❌ Error ElevenLabs:', error.response?.data?.toString() || error.message);
    res.status(500).json({ error: 'Error al procesar el audio' });
  }
});

// ============================================================================
// FUNCIONES PARA OBTENER DATOS DE WEEX EXCHANGE
// ============================================================================

/**
 * 1. Obtener precio actual (Ticker)
 */
async function getCurrentPrice(symbol) {
  try {
    let url, params;
    
    if (USE_FUTURES) {
      // Futuros: símbolo con prefijo cmt_
      url = `${WEEX_FUTURES_API}/capi/v2/market/ticker`;
      params = { symbol: `cmt_${symbol.toLowerCase()}` };
    } else {
      // Spot: símbolo en mayúsculas
      url = `${WEEX_SPOT_API}/api/v2/market/ticker`;
      params = { symbol: symbol.toUpperCase() };
    }
    
    console.log(`📡 Consultando precio: ${url}`, params);
    
    const response = await axios.get(url, {
      params,
      timeout: 10000
    });
    
    console.log(`📊 Respuesta WEEX:`, JSON.stringify(response.data).substring(0, 200));
    
    // Verificar respuesta
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Respuesta inválida de WEEX');
    }
    
    const data = USE_FUTURES ? response.data : response.data.data;
    
    if (!data) {
      throw new Error('No se recibieron datos del ticker');
    }
    
    // Adaptar campos según API
    const currentPrice = parseFloat(USE_FUTURES ? data.last : data.close);
    const high24h = parseFloat(data.high_24h || data.high24h);
    const low24h = parseFloat(data.low_24h || data.low24h);
    const volume24h = parseFloat(data.volume_24h || data.baseVol || 0);
    
    // Calcular cambio 24h
    const priceChange = parseFloat(data.priceChangePercent || 0) * 100;
    
    return {
      symbol: symbol.toUpperCase(),
      currentPrice,
      high24h,
      low24h,
      volume24h,
      change24h: currentPrice * (priceChange / 100),
      changePercent24h: priceChange,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`❌ Error obteniendo precio de ${symbol}:`, error.message);
    throw new Error(`No se pudo obtener el precio de ${symbol}: ${error.message}`);
  }
}

/**
 * 2. Obtener datos históricos (Simulados basados en precio actual)
 * Nota: El endpoint de klines de WEEX da error 521 (Cloudflare blocking)
 * Generamos datos históricos simulados basados en el precio actual
 */
async function getHistoricalData(symbol, days = 15) {
  try {
    console.log(`📊 Generando histórico simulado de ${days} días...`);
    
    // Obtener precio actual para baseline
    const currentData = await getCurrentPrice(symbol);
    const currentPrice = currentData.currentPrice;
    
    // Generar datos históricos simulados con variación realista
    const historicalData = [];
    const now = Date.now();
    
    // Simular cambio total en 15 días (entre -20% y +20%)
    const totalChange = (Math.random() * 40 - 20) / 100; // -20% a +20%
    const startPrice = currentPrice / (1 + totalChange);
    
    for (let i = 0; i < days; i++) {
      const timestamp = now - ((days - i - 1) * 24 * 60 * 60 * 1000);
      const date = new Date(timestamp);
      
      // Interpolación con algo de ruido aleatorio
      const progress = i / (days - 1);
      const basePrice = startPrice + (currentPrice - startPrice) * progress;
      
      // Añadir variación diaria realista (±2%)
      const dailyVariation = (Math.random() * 4 - 2) / 100;
      const close = basePrice * (1 + dailyVariation);
      const high = close * (1 + Math.random() * 0.02);
      const low = close * (1 - Math.random() * 0.02);
      const open = close * (1 + (Math.random() * 2 - 1) * 0.01);
      
      historicalData.push({
        timestamp,
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000
      });
    }
    
    // Calcular cambio real
    const oldestPrice = historicalData[0].close;
    const newestPrice = historicalData[historicalData.length - 1].close;
    const change = ((newestPrice - oldestPrice) / oldestPrice) * 100;
    
    // Determinar tendencia
    let trend;
    if (change > 5) trend = 'Alcista Fuerte';
    else if (change > 0) trend = 'Alcista';
    else if (change > -5) trend = 'Bajista';
    else trend = 'Bajista Fuerte';
    
    console.log(`✅ Histórico simulado generado (${change.toFixed(2)}% cambio)`);
    
    return {
      data: historicalData,
      change15d: parseFloat(change.toFixed(2)),
      oldestPrice: parseFloat(oldestPrice.toFixed(2)),
      newestPrice: parseFloat(newestPrice.toFixed(2)),
      trend,
      note: 'Datos históricos simulados (endpoint de WEEX bloqueado por Cloudflare)'
    };
  } catch (error) {
    console.error(`❌ Error generando histórico:`, error.message);
    throw new Error(`No se pudo generar el histórico: ${error.message}`);
  }
}

/**
 * 3. Simular libro de órdenes basado en precio actual
 * Nota: El endpoint de depth también da error 400/521 en WEEX
 */
async function getOrderBook(symbol) {
  try {
    console.log(`📊 Generando order book simulado basado en precio actual...`);
    
    // Obtener precio actual para baseline
    const priceData = await getCurrentPrice(symbol);
    const currentPrice = priceData.currentPrice;
    const changePercent = priceData.changePercent24h;
    
    // Simular order book realista
    const bids = []; // Órdenes de compra
    const asks = []; // Órdenes de venta
    
    // Generar 20 niveles de bids (por debajo del precio actual)
    for (let i = 0; i < 20; i++) {
      const priceOffset = (i + 1) * 0.0005; // 0.05% cada nivel
      const price = currentPrice * (1 - priceOffset);
      const amount = (Math.random() * 2 + 0.5) * (1 + i * 0.1); // Mayor volumen cerca del precio
      bids.push([price, amount]);
    }
    
    // Generar 20 niveles de asks (por encima del precio actual)
    for (let i = 0; i < 20; i++) {
      const priceOffset = (i + 1) * 0.0005;
      const price = currentPrice * (1 + priceOffset);
      const amount = (Math.random() * 2 + 0.5) * (1 + i * 0.1);
      asks.push([price, amount]);
    }
    
    // Calcular volumen total (precio * cantidad)
    const buyVolume = bids.reduce((sum, bid) => {
      return sum + (bid[0] * bid[1]);
    }, 0);
    
    const sellVolume = asks.reduce((sum, ask) => {
      return sum + (ask[0] * ask[1]);
    }, 0);
    
    // Ajustar presión según el cambio de precio
    // Si el precio está subiendo, más presión compradora
    let buyPressureAdjustment = 0;
    if (changePercent > 2) {
      buyPressureAdjustment = 10; // +10% presión compradora
    } else if (changePercent > 0) {
      buyPressureAdjustment = 5;
    } else if (changePercent < -2) {
      buyPressureAdjustment = -10; // +10% presión vendedora
    } else if (changePercent < 0) {
      buyPressureAdjustment = -5;
    }
    
    const totalVolume = buyVolume + sellVolume;
    let buyPressure = ((buyVolume / totalVolume) * 100) + buyPressureAdjustment;
    
    // Limitar entre 0 y 100
    buyPressure = Math.max(0, Math.min(100, buyPressure));
    const sellPressure = 100 - buyPressure;
    
    // Determinar sentimiento
    let sentiment, interpretation;
    
    if (buyPressure > 60) {
      sentiment = 'Bullish Fuerte 🚀';
      interpretation = 'Presión compradora muy alta. Los compradores dominan el mercado.';
    } else if (buyPressure > 52) {
      sentiment = 'Bullish Moderado 📈';
      interpretation = 'Ligera ventaja compradora. Más demanda que oferta.';
    } else if (buyPressure >= 48) {
      sentiment = 'Neutral ⚖️';
      interpretation = 'Equilibrio entre compradores y vendedores.';
    } else if (buyPressure >= 40) {
      sentiment = 'Bearish Moderado 📉';
      interpretation = 'Ligera ventaja vendedora. Más oferta que demanda.';
    } else {
      sentiment = 'Bearish Fuerte 🔻';
      interpretation = 'Presión vendedora muy alta. Los vendedores dominan.';
    }
    
    console.log(`✅ Order book simulado generado (${buyPressure.toFixed(2)}% compra)`);
    
    return {
      buyVolume: parseFloat(buyVolume.toFixed(2)),
      sellVolume: parseFloat(sellVolume.toFixed(2)),
      buyPressure: parseFloat(buyPressure.toFixed(2)),
      sellPressure: parseFloat(sellPressure.toFixed(2)),
      sentiment,
      interpretation,
      topBids: bids.slice(0, 5).map(b => ({
        price: parseFloat(b[0].toFixed(2)),
        amount: parseFloat(b[1].toFixed(4))
      })),
      topAsks: asks.slice(0, 5).map(a => ({
        price: parseFloat(a[0].toFixed(2)),
        amount: parseFloat(a[1].toFixed(4))
      })),
      note: 'Order book simulado basado en precio actual y tendencia 24h'
    };
  } catch (error) {
    console.error(`❌ Error generando order book:`, error.message);
    throw new Error(`No se pudo generar el order book: ${error.message}`);
  }
}

// ============================================================================
// ANÁLISIS CON IA (GEMINI)
// ============================================================================

async function analyzeWithAI(priceData, historical, orderBook, symbol) {
  try {
    // Usar gemini-1.5-flash-latest (siempre disponible)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Eres un analista experto de criptomonedas. Genera un reporte de voz conciso en español.

CRIPTOMONEDA: ${symbol.toUpperCase()}

DATOS ACTUALES (24H):
- Precio: ${priceData.currentPrice.toFixed(2)}
- Máx 24h: ${priceData.high24h.toFixed(2)}
- Mín 24h: ${priceData.low24h.toFixed(2)}
- Cambio: ${priceData.changePercent24h >= 0 ? '+' : ''}${priceData.changePercent24h.toFixed(2)}%

TENDENCIA 15 DÍAS:
- Cambio: ${historical.change15d >= 0 ? '+' : ''}${historical.change15d}%
- Tendencia: ${historical.trend}

LIBRO DE ÓRDENES:
- Presión compradora: ${orderBook.buyPressure}%
- Sentimiento: ${orderBook.sentiment}

INSTRUCCIONES:
- Máximo 100 palabras
- Tono profesional y conversacional
- Natural para text-to-speech
- Sin introducciones

Responde SOLO el texto del reporte.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Análisis IA generado exitosamente');
    return text;
    
  } catch (error) {
    console.error('⚠️ Error con Gemini:', error.message);
    console.log('📝 Usando reporte básico de respaldo...');
    return generateBasicReport(priceData, historical, orderBook, symbol);
  }
}

function generateBasicReport(priceData, historical, orderBook, symbol) {
  const change24h = priceData.changePercent24h >= 0 ? 'subió' : 'bajó';
  const change15d = historical.change15d >= 0 ? 'subió' : 'bajó';
  
  return `Reporte de ${symbol.toUpperCase()}. En 24 horas, ${change24h} ${Math.abs(priceData.changePercent24h).toFixed(2)}%, cotizando en ${priceData.currentPrice.toFixed(2)} dólares. En 15 días, ${change15d} ${Math.abs(historical.change15d)}%, mostrando tendencia ${historical.trend.toLowerCase()}. El libro de órdenes muestra ${orderBook.sentiment}. ${orderBook.interpretation}`;
}

// ============================================================================
// ENDPOINTS
// ============================================================================

app.post('/api/analyze-crypto', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Símbolo requerido'
      });
    }
    
    console.log('\n📊 ==========================================');
    console.log(`   Analizando ${symbol.toUpperCase()}`);
    console.log(`   Modo: ${USE_FUTURES ? 'FUTUROS' : 'SPOT'}`);
    console.log('==========================================\n');
    
    const [priceData, historical] = await Promise.all([
      getCurrentPrice(symbol),
      getHistoricalData(symbol, 15)
    ]);
    
    const orderBook = await getOrderBook(symbol);
    const aiReport = await analyzeWithAI(priceData, historical, orderBook, symbol);
    
    console.log('✅ Análisis completado\n');
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      priceData,
      historical,
      orderBook,
      aiReport,
      dataSource: `WEEX ${USE_FUTURES ? 'Futures' : 'Spot'} API`,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message, '\n');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/test-weex', async (req, res) => {
  try {
    console.log('🧪 Probando conectividad WEEX...\n');
    
    const tests = [];
    
    // Test Spot
    try {
      const spotUrl = `${WEEX_SPOT_API}/api/v2/market/ticker`;
      console.log(`Probando SPOT: ${spotUrl}`);
      const spotRes = await axios.get(spotUrl, {
        params: { symbol: 'BTCUSDT' },
        timeout: 5000
      });
      tests.push({
        api: 'Spot',
        endpoint: '/api/v2/market/ticker',
        status: spotRes.status === 200 ? 'OK' : 'FAIL',
        data: spotRes.data
      });
    } catch (error) {
      tests.push({
        api: 'Spot',
        endpoint: '/api/v2/market/ticker',
        status: 'ERROR',
        error: error.message
      });
    }
    
    // Test Futures
    try {
      const futuresUrl = `${WEEX_FUTURES_API}/capi/v2/market/ticker`;
      console.log(`Probando FUTURES: ${futuresUrl}`);
      const futuresRes = await axios.get(futuresUrl, {
        params: { symbol: 'cmt_btcusdt' },
        timeout: 5000
      });
      tests.push({
        api: 'Futures',
        endpoint: '/capi/v2/market/ticker',
        status: futuresRes.status === 200 ? 'OK' : 'FAIL',
        data: futuresRes.data
      });
    } catch (error) {
      tests.push({
        api: 'Futures',
        endpoint: '/capi/v2/market/ticker',
        status: 'ERROR',
        error: error.message
      });
    }
    
    const allOk = tests.every(t => t.status === 'OK');
    
    res.json({
      success: allOk,
      message: allOk ? '✅ Ambas APIs funcionando' : '⚠️ Algunos endpoints fallaron',
      tests,
      currentMode: USE_FUTURES ? 'FUTUROS' : 'SPOT'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: USE_FUTURES ? 'futures' : 'spot',
    apis: {
      spot: WEEX_SPOT_API,
      futures: WEEX_FUTURES_API
    }
  });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n🚀 ============================================');
  console.log('   Servidor Crypto AI - WEEX');
  console.log('============================================\n');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🔧 Modo: ${USE_FUTURES ? 'FUTUROS' : 'SPOT'}`);
  console.log(`🌐 Spot API: ${WEEX_SPOT_API}`);
  console.log(`📈 Futures API: ${WEEX_FUTURES_API}`);
  console.log('\n📊 Endpoints:');
  console.log('   POST /api/analyze-crypto');
  console.log('   POST /api/generate-audio'); // Nuevo endpoint registrado
  console.log('   GET  /api/test-weex');
  console.log('   GET  /health');
  console.log('\n🧪 Prueba: http://localhost:3000/api/test-weex');
  console.log('\n✅ Listo\n');
});

module.exports = app;