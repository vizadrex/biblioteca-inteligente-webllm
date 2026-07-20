
import { InventoryProvider } from './contexts/InventoryContext';
import { InventoryList } from './components/InventoryList';
import { AIChat } from './components/AIChat';
import logoUrl from './assets/LOGO UNJFSC sin fondo.png';

function App() {
  return (
    <InventoryProvider>
      <div className="app-container">
        <header className="app-header">
          <div className="logo-container">
            <img src={logoUrl} alt="UNJFSC Logo" className="unjfsc-logo" />
            <div className="title-group">
              <h1>Biblioteca Inteligente <span className="ai-badge">IA</span></h1>
              <p>Universidad Nacional José Faustino Sánchez Carrión</p>
            </div>
          </div>
        </header>
        
        <main className="main-content">
          <div className="content-grid">
            <section className="inventory-section">
              <InventoryList />
            </section>
            
            <section className="chat-section">
              <AIChat />
            </section>
          </div>
        </main>
      </div>
    </InventoryProvider>
  );
}

export default App;
