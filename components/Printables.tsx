import React, { useState, useEffect } from 'react';
import { Device } from '../types';
import { Printer, Scissors, CheckSquare, Square, FileText, Tag, Ticket } from 'lucide-react';

interface PrintablesProps {
  devices: Device[];
}

type PrintMode = 'seals' | 'tags' | 'acts';
type ActType = 'diagnosis' | 'works' | 'issue';

export const Printables: React.FC<PrintablesProps> = ({ devices }) => {
  const [printMode, setPrintMode] = useState<PrintMode>('tags');
  
  // State for Tags
  const [isBlankTags, setIsBlankTags] = useState(false);
  const [blankTagCount, setBlankTagCount] = useState(4);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());

  // State for Acts
  const [actType, setActType] = useState<ActType>('diagnosis');
  const [actCount, setActCount] = useState(1);

  // Initialize selected devices when devices prop changes
  useEffect(() => {
    if (devices.length > 0) {
      setSelectedDeviceIds(new Set(devices.map(d => d.id)));
    }
  }, [devices]);

  const toggleDeviceSelection = (id: string) => {
    const newSet = new Set(selectedDeviceIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDeviceIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDeviceIds.size === devices.length) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(devices.map(d => d.id)));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- RENDERERS FOR PRINT CONTENT ---

  const renderSeals = () => (
    <div className="grid grid-cols-4 gap-4 print:grid-cols-5 print:gap-2">
      {Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className="border-2 border-red-600 p-1 w-full aspect-[2.5/1] flex flex-col items-center justify-center bg-white relative overflow-hidden">
          <div className="absolute inset-0 border-[0.5px] border-red-200 opacity-50" style={{backgroundImage: 'radial-gradient(#fee2e2 1px, transparent 1px)', backgroundSize: '4px 4px'}}></div>
          <div className="z-10 text-[9px] font-black text-red-700 uppercase tracking-widest text-center border-b border-red-600 w-full pb-0.5 mb-0.5">
            ОПЕЧАТАНО
          </div>
          <div className="z-10 flex w-full justify-between items-end px-1">
             <div className="text-[7px] text-red-600 font-bold leading-tight text-left">
               НЕ<br/>ВСКРЫВАТЬ
             </div>
             <div className="flex flex-col items-center">
                <div className="w-12 h-3 border-b border-red-800 border-dotted"></div>
                <span className="text-[6px] text-red-400">подпись / дата</span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTags = () => {
    const itemsToPrint = isBlankTags 
      ? Array.from({ length: blankTagCount }).map((_, i) => ({ id: `blank-${i}`, isBlank: true } as any))
      : devices.filter(d => selectedDeviceIds.has(d.id));

    if (itemsToPrint.length === 0 && !isBlankTags) {
       return <div className="text-center text-gray-400 p-10">Нет выбранных устройств для печати.</div>;
    }

    return (
      <div className="grid grid-cols-2 gap-6 print:block print:gap-0">
        {itemsToPrint.map((device, i) => (
          <div key={device.id || i} className="border-2 border-dashed border-gray-800 p-4 bg-white relative print:mb-4 print:break-inside-avoid print:h-[48vh] flex flex-col">
            <div className="absolute top-2 right-2 text-gray-400 print:text-gray-600">
              <Scissors className="w-5 h-5" />
            </div>
            
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <h3 className="text-xl font-bold uppercase tracking-wider">Квитанция {device.isBlank ? '' : `#${device.id.slice(-4)}`}</h3>
              <p className="text-xs text-gray-500 uppercase">Мастерская Workshop Pro</p>
            </div>
            
            {/* Body */}
            <div className="flex-grow space-y-3 font-mono text-sm">
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase text-gray-500">Модель / Устройство:</span>
                <div className="border-b border-gray-400 h-6 pt-1 text-lg font-bold truncate">
                  {device.isBlank ? '' : device.deviceModel}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase text-gray-500">Клиент / Телефон:</span>
                <div className="border-b border-gray-400 h-6 pt-1 truncate">
                  {device.isBlank ? '' : device.clientName}
                </div>
              </div>

              <div className="flex gap-4">
                 <div className="flex-1 flex flex-col">
                    <span className="font-bold text-xs uppercase text-gray-500">Дата приема:</span>
                    <div className="border-b border-gray-400 h-6 pt-1">
                      {!device.isBlank && device.dateReceived ? new Date(device.dateReceived).toLocaleDateString('ru-RU') : ''}
                    </div>
                 </div>
                 <div className="flex-1 flex flex-col">
                    <span className="font-bold text-xs uppercase text-gray-500">Ориент. цена:</span>
                    <div className="border-b border-gray-400 h-6"></div>
                 </div>
              </div>

              <div className="flex flex-col h-full">
                <span className="font-bold text-xs uppercase text-gray-500">Неисправность / Комплектация:</span>
                <div className="border border-gray-300 rounded p-2 h-24 bg-gray-50 text-xs leading-tight">
                   {device.isBlank ? (
                      <div className="space-y-4 pt-1">
                         <div className="border-b border-gray-200"></div>
                         <div className="border-b border-gray-200"></div>
                         <div className="border-b border-gray-200"></div>
                      </div>
                   ) : device.issueDescription}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-black flex justify-between items-end">
               <div className="text-[10px] text-gray-500 w-1/2 leading-none">
                  Устройство принято на диагностику. Срок хранения готового изделия - 30 дней.
               </div>
               <div className="text-right">
                  <div className="border-b border-black w-24 mb-1"></div>
                  <div className="text-[10px] text-center uppercase">Подпись</div>
               </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderActs = () => {
    // Шаблон акта для ручного заполнения
    return (
      <div className="space-y-8 print:space-y-0">
        {Array.from({ length: actCount }).map((_, i) => (
          <div key={i} className="bg-white p-8 border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0 print:h-[100vh] print:flex print:flex-col relative">
             
             {/* Document Title */}
             <div className="text-center mb-8">
                <h1 className="text-2xl font-bold uppercase mb-1">
                   {actType === 'diagnosis' && 'Акт диагностики / Приема'}
                   {actType === 'works' && 'Акт выполненных работ'}
                   {actType === 'issue' && 'Акт выдачи оборудования'}
                </h1>
                <div className="w-full h-px bg-black mb-1"></div>
                <div className="w-full h-px bg-black"></div>
             </div>

             {/* Header Fields */}
             <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-4 font-mono text-sm">
                <div className="flex items-end">
                   <span className="font-bold mr-2">Дата:</span>
                   <div className="flex-1 border-b border-black"></div>
                </div>
                <div className="flex items-end">
                   <span className="font-bold mr-2">Заказ №:</span>
                   <div className="flex-1 border-b border-black"></div>
                </div>
                <div className="col-span-2 flex items-end">
                   <span className="font-bold mr-2">Клиент (ФИО):</span>
                   <div className="flex-1 border-b border-black"></div>
                </div>
                <div className="col-span-2 flex items-end">
                   <span className="font-bold mr-2">Телефон:</span>
                   <div className="flex-1 border-b border-black"></div>
                </div>
                <div className="col-span-2 flex items-end">
                   <span className="font-bold mr-2">Оборудование:</span>
                   <div className="flex-1 border-b border-black"></div>
                </div>
                <div className="col-span-2 flex items-end">
                   <span className="font-bold mr-2">Серийный номер / IMEI:</span>
                   <div className="flex-1 border-b border-black"></div>
                </div>
             </div>

             {/* Main Content Area */}
             <div className="flex-1 mb-6">
                <h3 className="font-bold uppercase text-sm mb-2 border-b border-gray-300 inline-block">
                   {actType === 'diagnosis' && 'Заявленная неисправность / Результаты диагностики:'}
                   {actType === 'works' && 'Выполненные работы / Установленные запчасти:'}
                   {actType === 'issue' && 'Состояние при выдаче / Комплектация:'}
                </h3>
                <div className="border border-gray-800 h-[300px] print:h-[40vh] p-4">
                   {/* Lines for writing */}
                   {Array.from({ length: 12 }).map((_, idx) => (
                      <div key={idx} className="border-b border-gray-300 h-8 w-full"></div>
                   ))}
                </div>
             </div>

             {/* Totals (Only for Works/Issue) */}
             {actType !== 'diagnosis' && (
                <div className="flex justify-end mb-8 font-mono text-lg">
                   <div className="w-1/2">
                      <div className="flex justify-between items-end mb-2">
                         <span>Стоимость работ:</span>
                         <div className="w-32 border-b border-black"></div>
                      </div>
                      <div className="flex justify-between items-end mb-2">
                         <span>Стоимость запчастей:</span>
                         <div className="w-32 border-b border-black"></div>
                      </div>
                      <div className="flex justify-between items-end font-bold text-xl mt-4">
                         <span>ИТОГО К ОПЛАТЕ:</span>
                         <div className="w-32 border-b-2 border-black"></div>
                      </div>
                   </div>
                </div>
             )}

             {/* Footer Signatures */}
             <div className="mt-auto grid grid-cols-2 gap-10 pt-4 border-t-2 border-black">
                <div>
                   <div className="text-xs font-bold uppercase mb-8">Исполнитель</div>
                   <div className="border-b border-black w-full"></div>
                   <div className="text-[10px] text-center text-gray-500 mt-1">Подпись / М.П.</div>
                </div>
                <div>
                   <div className="text-xs font-bold uppercase mb-8">Заказчик</div>
                   <div className="border-b border-black w-full"></div>
                   <div className="text-[10px] text-center text-gray-500 mt-1">С условиями ознакомлен, претензий не имею</div>
                </div>
             </div>
             
             {/* Cut Line (if printing A5 logic, but here we do full page usually. Let's add a small marker) */}
             <div className="absolute bottom-0 left-0 w-full text-center text-[8px] text-gray-300 print:block hidden">
                Workshop Pro Document Generator
             </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Control Panel - Hidden on Print */}
      <div className="no-print bg-white p-6 shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Printer className="w-6 h-6 text-blue-600" />
             Центр печати
           </h2>
           <button
             onClick={handlePrint}
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-transform active:scale-95"
           >
             <Printer className="w-5 h-5" />
             Печать (Ctrl+P)
           </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-1">
          <button onClick={() => setPrintMode('tags')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${printMode === 'tags' ? 'bg-slate-100 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Tag className="w-4 h-4"/> Бирки и Квитанции
          </button>
          <button onClick={() => setPrintMode('acts')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${printMode === 'acts' ? 'bg-slate-100 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <FileText className="w-4 h-4"/> Акты и Бланки
          </button>
          <button onClick={() => setPrintMode('seals')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${printMode === 'seals' ? 'bg-slate-100 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Ticket className="w-4 h-4"/> Гарантийные пломбы
          </button>
        </div>

        {/* Configuration Area */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
           
           {/* Config: TAGS */}
           {printMode === 'tags' && (
             <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <input 
                   type="checkbox" 
                   id="blankTags" 
                   checked={isBlankTags} 
                   onChange={(e) => setIsBlankTags(e.target.checked)}
                   className="w-5 h-5 text-blue-600 rounded"
                 />
                 <label htmlFor="blankTags" className="font-medium text-gray-700 cursor-pointer">Печатать пустые бланки (для заполнения от руки)</label>
               </div>

               {isBlankTags ? (
                 <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Количество копий:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={blankTagCount} 
                      onChange={(e) => setBlankTagCount(parseInt(e.target.value) || 1)}
                      className="border border-gray-300 rounded p-1 w-20 text-center" 
                    />
                 </div>
               ) : (
                 <div className="bg-white border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2">
                    <div className="flex justify-between items-center mb-2 px-2">
                       <span className="text-xs font-bold text-gray-500 uppercase">Выберите устройства ({selectedDeviceIds.size})</span>
                       <button onClick={toggleSelectAll} className="text-xs text-blue-600 hover:underline">
                         {selectedDeviceIds.size === devices.length ? 'Снять выделение' : 'Выбрать все'}
                       </button>
                    </div>
                    {devices.length === 0 && <p className="text-sm text-gray-400 p-2">Нет устройств в работе</p>}
                    {devices.map(dev => (
                      <div key={dev.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer" onClick={() => toggleDeviceSelection(dev.id)}>
                        {selectedDeviceIds.has(dev.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                        <span className="text-sm font-mono">{dev.deviceModel} <span className="text-gray-400">- {dev.clientName}</span></span>
                      </div>
                    ))}
                 </div>
               )}
             </div>
           )}

           {/* Config: ACTS */}
           {printMode === 'acts' && (
             <div className="flex flex-wrap gap-6">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Тип документа</label>
                   <select 
                     value={actType} 
                     onChange={(e) => setActType(e.target.value as ActType)}
                     className="border border-gray-300 rounded p-2 bg-white w-64"
                   >
                     <option value="diagnosis">Акт диагностики / Приема</option>
                     <option value="works">Акт выполненных работ</option>
                     <option value="issue">Акт выдачи (Тех. лист)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Количество копий</label>
                   <input 
                     type="number" 
                     min="1" 
                     max="20" 
                     value={actCount} 
                     onChange={(e) => setActCount(parseInt(e.target.value) || 1)}
                     className="border border-gray-300 rounded p-2 w-24"
                   />
                </div>
             </div>
           )}

           {/* Config: SEALS */}
           {printMode === 'seals' && (
             <p className="text-sm text-gray-500">Печать листа гарантийных пломб (25 штук на странице). Используйте самоклеящуюся бумагу.</p>
           )}
        </div>
      </div>

      {/* Preview Area (Visible on Screen) & Print Area */}
      <div className="bg-gray-100 flex-1 p-8 overflow-auto print:p-0 print:bg-white print:overflow-visible">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg p-8 min-h-[297mm] print:shadow-none print:p-0 print:min-h-0 print:w-full">
          {printMode === 'seals' && renderSeals()}
          {printMode === 'tags' && renderTags()}
          {printMode === 'acts' && renderActs()}
        </div>
      </div>
    </div>
  );
};
