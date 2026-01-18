import React from 'react';
import CryptoAnalysis from './components/CryptoAnalysis';

function App() {
  return (
    <div style={styles.appContainer}>
      {/* Puedes agregar un Header global aquí si lo deseas */}
      <CryptoAnalysis />
    </div>
  );
}

const styles = {
  appContainer: {
    margin: 0,
    padding: 0,
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#0F172A', // Fondo oscuro consistente
    display: 'flex',
    flexDirection: 'column',
  }
};

export default App;