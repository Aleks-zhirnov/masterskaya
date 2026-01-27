import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Package, 
  Printer, 
  Bot, 
  Plus, 
  Trash2, 
  Calendar, 
  Search, 
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ShoppingCart,
  MoveRight
} from 'lucide-react';
import { Device, DeviceStatus, PartType, SparePart, ViewState, ChatMessage } from './types';
import { generateWorkshopAdvice } from './services/ai';
import { Printables } from './components/Printables';

// Hook for local storage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue] as const;
}

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<ViewState>('repair');
  
  // Devices State
  const [devices, setDevices] = useLocalStorage<Device[]>('workshop_devices', []);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState<Partial<Device>>({ status: DeviceStatus.RECEIVED });
  
  // Inventory State
  const [parts, setParts] = useLocalStorage<SparePart[]>('workshop_parts', []);
  const [inventoryTab, setInventoryTab] = useState<'stock' | 'buy'>('stock');
  const [newPartName, setNewPartName] = useState('');
  const [newPartType, setNewPartType] = useState<PartType>(PartType.OTHER);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Привет! Я ваш AI-помощник по мастерской. Чем могу помочь? (Например: "Какой аналог у транзистора KT315?" или "Составь чек-лист диагностики БП")' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- HELPERS ---

  // Sort devices by date (Oldest first)
  const sortedDevices = [...devices].sort((a, b) => 
    new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime()
  );

  const addDevice = () => {
    if (!newDevice.clientName || !newDevice.deviceModel) return;
    const device: Device = {
      id: Date.now().toString(),
      clientName: newDevice.clientName,
      deviceModel: newDevice.deviceModel,
      issueDescription: newDevice.issueDescription || '',
      dateReceived: new Date().toISOString(),
      status: DeviceStatus.RECEIVED,
      notes: ''
    };
    setDevices((prev) => [...prev, device]);
    setNewDevice({ status: DeviceStatus.RECEIVED });
    setShowAddDeviceModal(false);
  };

  const updateDeviceStatus = (id: string, status: DeviceStatus) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const deleteDevice = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить это устройство из базы?')) {
      setDevices(prev => prev.filter(d => d.id !== id));
    }
  };

  const addPart = () => {
    if (!newPartName) return;
    const part: SparePart = {
      id: Date.now().toString(),
      name: newPartName,
      type: newPartType,
      quantity: 1,
      inStock: inventoryTab === 'stock'
    };
    setParts(prev => [...prev, part]);
    setNewPartName('');
  };

  const togglePartStockStatus = (id: string) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p));
  };

  const deletePart = (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    const prompt = `Контекст: Мастерская электроники.
    Текущие устройства в ремонте: ${devices.map(d => `${d.deviceModel} (${d.issueDescription})`).join(', ')}.
    Вопрос: ${userMsg.text}`;

    const responseText = await generateWorkshopAdvice(prompt);
    
    setIsChatLoading(false);
    setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
  };

  // --- RENDERERS ---

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto no-print z-10">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
          <Wrench className="w-8 h-8" />
          Мастерская
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Учет и Контроль</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <button 
          onClick={() => setView('repair')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'repair' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Clock className="w-5 h-5" />
          <span>В ремонте</span>
          {devices.length > 0 && <span className="ml-auto bg-slate-700 text-xs px-2 py-0.5 rounded-full">{devices.length}</span>}
        </button>

        <button 
          onClick={() => setView('inventory')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Package className="w-5 h-5" />
          <span>Склад и Покупки</span>
        </button>

        <button 
          onClick={() => setView('print')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'print' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Printer className="w-5 h-5" />
          <span>Печать</span>
        </button>

        <button 
          onClick={() => setView('ai_chat')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'ai_chat' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Bot className="w-5 h-5" />
          <span>AI Помощник</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          &copy; 2025 Workshop Pro
        </div>
      </div>
    </div>
  );

  const renderRepairView = () => (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Устройства в работе</h2>
          <p className="text-slate-500">Сортировка: от старых к новым</p>
        </div>
        <button 
          onClick={() => setShowAddDeviceModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Принять устройство
        </button>
      </div>

      <div className="grid gap-4">
        {sortedDevices.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Нет устройств в ремонте</p>
          </div>
        ) : (
          sortedDevices.map((device) => (
            <div key={device.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-wide">
                    {new Date(device.dateReceived).toLocaleDateString('ru-RU')}
                  </span>
                  <h3 className="text-xl font-bold text-slate-800">{device.deviceModel}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-2">Владелец: <span className="font-medium text-slate-700">{device.clientName}</span></p>
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100 mb-3">
                  <span className="font-bold">Проблема:</span> {device.issueDescription}
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Статус</label>
                  <select 
                    value={device.status} 
                    onChange={(e) => updateDeviceStatus(device.id, e.target.value as DeviceStatus)}
                    className={`w-full p-2 rounded border font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      device.status === DeviceStatus.READY ? 'bg-green-100 text-green-800 border-green-200' : 
                      device.status === DeviceStatus.ISSUED ? 'bg-gray-100 text-gray-500 border-gray-200' :
                      'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {Object.values(DeviceStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => deleteDevice(device.id)}
                    className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Новое устройство</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Модель устройства</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Напр. Samsung TV, Утюг Philips..."
                  value={newDevice.deviceModel || ''}
                  onChange={e => setNewDevice({...newDevice, deviceModel: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Имя клиента</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Иван Иванович"
                  value={newDevice.clientName || ''}
                  onChange={e => setNewDevice({...newDevice, clientName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Описание поломки</label>
                <textarea 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
                  placeholder="Не включается, искрит..."
                  value={newDevice.issueDescription || ''}
                  onChange={e => setNewDevice({...newDevice, issueDescription: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowAddDeviceModal(false)}
                  className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button 
                  onClick={addDevice}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInventoryView = () => {
    const displayedParts = parts.filter(p => inventoryTab === 'stock' ? p.inStock : !p.inStock);

    return (
      <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Склад запчастей</h2>
        
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button 
            onClick={() => setInventoryTab('stock')}
            className={`pb-3 px-4 font-medium transition-colors relative ${inventoryTab === 'stock' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            В Наличии
            {inventoryTab === 'stock' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
          </button>
          <button 
            onClick={() => setInventoryTab('buy')}
            className={`pb-3 px-4 font-medium transition-colors relative flex items-center gap-2 ${inventoryTab === 'buy' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Купить (Список покупок)
            <ShoppingCart className="w-4 h-4" />
            {inventoryTab === 'buy' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-3">
          <select 
            value={newPartType}
            onChange={(e) => setNewPartType(e.target.value as PartType)}
            className="p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input 
            type="text" 
            placeholder={inventoryTab === 'stock' ? "Добавить деталь на склад..." : "Что нужно купить?"}
            className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newPartName}
            onChange={(e) => setNewPartName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPart()}
          />
          <button 
            onClick={addPart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20">
          {displayedParts.map(part => (
            <div key={part.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center group">
              <div>
                <span className="text-xs text-blue-500 font-bold uppercase tracking-wider block mb-1">{part.type}</span>
                <span className="font-medium text-slate-800 text-lg">{part.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => togglePartStockStatus(part.id)}
                  className={`p-2 rounded-full transition-colors ${part.inStock ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                  title={part.inStock ? "Переместить в 'Купить'" : "Переместить в 'Наличие'"}
                >
                  {part.inStock ? <ShoppingCart className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => deletePart(part.id)}
                  className="p-2 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {displayedParts.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-10">
              Список пуст
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAIChat = () => (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-6 bg-white border-b border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-600" />
          AI Помощник
        </h2>
        <p className="text-sm text-slate-500">Спросите про аналоги, схемы или диагностику.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              {msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex items-center gap-2 text-slate-500">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Задайте вопрос AI..."
            className="flex-1 p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isChatLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isChatLoading || !chatInput.trim()}
            className="bg-purple-600 disabled:bg-purple-300 text-white p-4 rounded-xl transition-colors hover:bg-purple-700"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      {renderSidebar()}
      
      <main className="flex-1 ml-64 print:ml-0 h-screen overflow-auto print:overflow-visible">
        {view === 'repair' && renderRepairView()}
        {view === 'inventory' && renderInventoryView()}
        {view === 'print' && <Printables devices={devices.filter(d => d.status !== DeviceStatus.ISSUED)} />}
        {view === 'ai_chat' && renderAIChat()}
      </main>
    </div>
  );
}

export default App;