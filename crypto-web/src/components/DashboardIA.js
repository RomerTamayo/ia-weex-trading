// src/components/DashboardIA.js
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const DashboardIA = () => {
    const [viewData, setViewData] = useState([]);
    const [aiAdvice, setAiAdvice] = useState("");
    const [loading, setLoading] = useState(false);

    // Función para obtener el "Flash Analysis" de la IA
    const getAiDeepDive = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/ai-strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols: ['btcusdt', 'ethusdt', 'dashusdt'] }) // Las 20
            });
            const data = await res.json();
            setAiAdvice(data.strategy);
            // Aquí llamarías a tu función de audio existente
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2>Crypto Scanner IA 📡</h2>
                <button onClick={getAiDeepDive} style={styles.aiButton}>
                    {loading ? "Analizando..." : "Preguntar a IA Oportunidad"}
                </button>
            </header>

            {aiAdvice && (
                <div style={styles.aiCard}>
                    <p>🎙️ <strong>Sugerencia de la IA:</strong> {aiAdvice}</p>
                </div>
            )}

            <div style={styles.grid}>
                {/* Gráfico de Presión de Volumen (Últimos 50 trades) */}
                <div style={styles.card}>
                    <h3>Presión de Compra/Venta (Top 3)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={mockOrderData}>
                            <XAxis dataKey="name" />
                            <Tooltip />
                            <Bar dataKey="compra" fill="#10B981" />
                            <Bar dataKey="venta" fill="#EF4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Mapa de Calor de Precios Reales */}
                <div style={styles.card}>
                    <h3>Velas Reales (Tendencia 24h)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={mockCandleData}>
                            <Line type="monotone" dataKey="price" stroke="#3B82F6" dot={false} />
                            <YAxis hide domain={['auto', 'auto']} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', backgroundColor: '#0F172A', minHeight: '100vh', color: 'white' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
    aiButton: { padding: '10px 20px', borderRadius: '8px', backgroundColor: '#8B5CF6', color: 'white', border: 'none', cursor: 'pointer' },
    aiCard: { backgroundColor: '#1E293B', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #F59E0B', margin: '20px 0' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#1E293B', padding: '15px', borderRadius: '12px' }
};

export default DashboardIA;