import React, { useState, useEffect } from 'react';
import { Device } from '../types';
import { Printer, Scissors, CheckSquare, Square, FileText, Tag, Ticket, GripHorizontal } from 'lucide-react';

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
  const [actCount, setActCount] = useState(2); // По умолчанию 2, чтобы показать фичу 2-х актов на листе

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
    <div className="grid grid-cols-4 gap-4 print:grid-cols-5 print:gap-2 print:content-start">
      {Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className="border-2 border-red-600 p-1 w-full aspect-[2.5/1] flex flex-col items-center justify-center bg-white relative overflow-hidden print:break-inside-avoid">
          <div className="absolute inset-0 border-[0.5px] border-red-200 opacity-50" style={{backgroundImage: 'radial-gradient(#fee2e2 1px, transparent 1px)', backgroundSize: '4px 4px'}}></div>
          <div className="z-10 text-[9px] font-black text-red-700 uppercase tracking-widest text-center border-b border-red-600 w-full pb-0.5 mb-0.5 leading-none">
            ОПЕЧАТАНО
          </div>
          <div className="z-10 flex w-full justify-between items-end px-1">
             <div className="text-[7px] text-red-600 font-bold leading-tight text-left">
               НЕ<br/>ВСКРЫВАТЬ
             </div>
             <div className="flex flex-col items-center">
                <div className="w-12 h-3 border-b border-red-800 border-dotted"></div>
                <span className="text-[6px] text-red-400 leading-none mt-0.5">подпись / дата</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:content-start">
        {itemsToPrint.map((device, i) => (
          <div key={device.id || i} className="border-2 border-dashed border-gray-800 p-4 bg-white relative flex flex-col print:break-inside-avoid print:mb-2 shadow-sm print:shadow-none">
            <div className="absolute top-2 right-2 text-gray-400 print:text-gray-600">
              <Scissors className="w-5 h-5" />
            </div>
            
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-3">
              <h3 className="text-xl font-bold uppercase tracking-wider leading-none">Квитанция {device.isBlank ? '' : `#${device.id.slice(-4)}`}</h3>
              {!device.isBlank && <div className="text-[10px] text-gray-500 mt-1">{new Date().toLocaleDateString()}</div>}
            </div>
            
            {/* Body */}
            <div className="flex-grow space-y-3 font-mono text-sm">
              <div className="flex flex-col">
                <span className="font-bold text-[10px] uppercase text-gray-500 mb-0.5">Модель / Устройство:</span>
                <div className="border-b border-gray-400 min-h-[2.5em] pb-1 text-base font-bold leading-tight break-words line-clamp-2">
                  {device.isBlank ? '' : device.deviceModel}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-[10px] uppercase text-gray-500 mb-0.5">Клиент / Контакты:</span>
                <div className="border-b border-gray-400 min-h-[1.5em] pb-1 truncate leading-tight">
                  {device.isBlank ? '' : device.clientName}
                </div>
              </div>

              <div className="flex gap-4">
                 <div className="flex-1 flex flex-col">
                    <span className="font-bold text-[10px] uppercase text-gray-500 mb-0.5">Дата приема:</span>
                    <div className="border-b border-gray-400 h-6 pt-0.5">
                      {!device.isBlank && device.dateReceived ? new Date(device.dateReceived).toLocaleDateString('ru-RU') : ''}
                    </div>
                 </div>
                 <div className="flex-1 flex flex-col">
                    <span className="font-bold text-[10px] uppercase text-gray-500 mb-0.5">Сумма / Предоплата:</span>
                    <div className="border-b border-gray-400 h-6"></div>
                 </div>
              </div>

              <div className="flex flex-col h-full">
                <span className="font-bold text-[10px] uppercase text-gray-500 mb-1">Неисправность / Комплект:</span>
                <div className="border border-gray-300 rounded p-2 h-32 bg-gray-50 text-xs leading-snug overflow-hidden print:bg-white print:border-gray-800">
                   {device.isBlank ? (
                      <div className="space-y-4 pt-1">
                         <div className="border-b border-gray-200"></div>
                         <div className="border-b border-gray-200"></div>
                         <div className="border-b border-gray-200"></div>
                      </div>
                   ) : (
                     <>
                        <span className="font-bold">Дефект: </span>{device.issueDescription}
                     </>
                   )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderActs = () => {
    return (
      <div className="flex flex-col gap-8 print:gap-0 print:block">
        {Array.from({ length: actCount }).map((_, i) => (
          <div key={i} className={`bg-white p-8 border border-gray-200 shadow-sm relative print:shadow-none print:border-none print:p-0 print:h-[49.5vh] print:flex print:flex-col print:justify-between print:mb-0 box-border ${i % 2 !== 0 ? 'print:pt-8 border-t-2 print:border-t-0' : ''}`}>
             
             {/* Линия отреза для печати (появляется только между двумя актами на странице) */}
             {i % 2 !== 0 && (
                <div className="hidden print:flex absolute top-0 left-0 w-full items-center justify-center -mt-4 text-gray-400">
                   <div className="border-b border-dashed border-gray-400 w-full absolute top-1/2"></div>
                   <div className="bg-white px-2 z-10 flex items-center gap-1 text-[10px]"><Scissors className="w-3 h-3"/> Линия отреза</div>
                </div>
             )}

             <div>
                {/* Document Title */}
                <div className="text-center mb-4 print:mb-2">
                    <h1 className="text-xl font-bold uppercase mb-0.5 leading-none">
                    {actType === 'diagnosis' && 'Акт приема оборудования'}
                    {actType === 'works' && 'Акт выполненных работ'}
                    {actType === 'issue' && 'Акт выдачи (Технический лист)'}
                    </h1>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Сервисный центр "Мастерская Про"</div>
                    <div className="w-full h-px bg-black mt-2"></div>
                </div>

                {/* Header Fields - Compact for A5/Half-page */}
                <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs print:text-[10px]">
                    <div className="flex items-end">
                        <span className="font-bold mr-1 whitespace-nowrap">Дата:</span>
                        <div className="flex-1 border-b border-black text-center">{new Date().toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-end">
                        <span className="font-bold mr-1 whitespace-nowrap">Заказ №:</span>
                        <div className="flex-1 border-b border-black"></div>
                    </div>
                    <div className="col-span-2 flex items-end">
                        <span className="font-bold mr-1 whitespace-nowrap">Клиент:</span>
                        <div className="flex-1 border-b border-black"></div>
                    </div>
                    <div className="col-span-2 flex items-end">
                        <span className="font-bold mr-1 whitespace-nowrap">Модель:</span>
                        <div className="flex-1 border-b border-black"></div>
                    </div>
                    <div className="col-span-2 flex items-end">
                        <span className="font-bold mr-1 whitespace-nowrap">S/N:</span>
                        <div className="flex-1 border-b border-black"></div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 mb-2">
                    <div className="bg-gray-100 print:bg-white print:border print:border-gray-300 px-2 py-1 text-xs font-bold uppercase mb-1">
                    {actType === 'diagnosis' && 'Заявленная неисправность / Комплектация'}
                    {actType === 'works' && 'Выполненные работы / Запчасти'}
                    {actType === 'issue' && 'Состояние при выдаче / Рекомендации'}
                    </div>
                    <div className="border border-gray-300 h-48 print:h-[5cm] p-2 relative">
                        {/* Lines for writing */}
                        <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none p-2 opacity-20">
                            {Array.from({ length: 7 }).map((_, idx) => (
                                <div key={idx} className="border-b border-black w-full h-px"></div>
                            ))}
                        </div>
                    </div>
                </div>
             </div>

             {/* Footer Section */}
             <div>
                {/* Totals */}
                {actType !== 'diagnosis' && (
                    <div className="flex justify-end mb-4 font-mono text-sm print:mb-2">
                    <div className="w-2/3 print:w-1/2">
                        <div className="flex justify-between items-end mb-1">
                            <span>Итого (запчасти):</span>
                            <div className="w-20 border-b border-black"></div>
                        </div>
                        <div className="flex justify-between items-end mb-1">
                            <span>Итого (работа):</span>
                            <div className="w-20 border-b border-black"></div>
                        </div>
                        <div className="flex justify-between items-end font-bold text-base mt-2">
                            <span>К ОПЛАТЕ:</span>
                            <div className="w-24 border-b-2 border-black"></div>
                        </div>
                    </div>
                    </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-2 border-t border-black mt-auto">
                    <div>
                        <div className="text-[10px] font-bold uppercase mb-4 text-gray-600">Исполнитель</div>
                        <div className="border-b border-black w-full mb-1"></div>
                        <div className="text-[8px] text-center text-gray-400">М.П.</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase mb-4 text-gray-600">Заказчик</div>
                        <div className="border-b border-black w-full mb-1"></div>
                        <div className="text-[8px] text-center text-gray-400">Претензий не имею</div>
                    </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Control Panel - Hidden on Print */}
      <div className="no-print bg-white px-6 py-4 shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <Printer className="w-5 h-5 text-blue-600" />
             Центр печати
           </h2>
           <button
             onClick={handlePrint}
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-transform active:scale-95 text-sm"
           >
             <Printer className="w-4 h-4" />
             Печать (Ctrl+P)
           </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setPrintMode('tags')} className={`whitespace-nowrap px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 text-sm ${printMode === 'tags' ? 'bg-slate-100 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Tag className="w-4 h-4"/> Квитанции (4/лист)
          </button>
          <button onClick={() => setPrintMode('acts')} className={`whitespace-nowrap px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 text-sm ${printMode === 'acts' ? 'bg-slate-100 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <FileText className="w-4 h-4"/> Акты (2/лист)
          </button>
          <button onClick={() => setPrintMode('seals')} className={`whitespace-nowrap px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 text-sm ${printMode === 'seals' ? 'bg-slate-100 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Ticket className="w-4 h-4"/> Пломбы
          </button>
        </div>

        {/* Configuration Area */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
           
           {/* Config: TAGS */}
           {printMode === 'tags' && (
             <div className="space-y-3">
               <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   id="blankTags" 
                   checked={isBlankTags} 
                   onChange={(e) => setIsBlankTags(e.target.checked)}
                   className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                 />
                 <label htmlFor="blankTags" className="font-medium text-gray-700 cursor-pointer">Печатать пустые бланки</label>
               </div>

               {isBlankTags ? (
                 <div className="flex items-center gap-2">
                    <label className="text-gray-600">Количество:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={blankTagCount} 
                      onChange={(e) => setBlankTagCount(parseInt(e.target.value) || 1)}
                      className="border border-gray-300 rounded p-1 w-16 text-center" 
                    />
                 </div>
               ) : (
                 <div className="bg-white border border-gray-300 rounded-lg max-h-32 overflow-y-auto p-2">
                    <div className="flex justify-between items-center mb-1 px-1">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Выбрано: {selectedDeviceIds.size}</span>
                       <button onClick={toggleSelectAll} className="text-[10px] text-blue-600 hover:underline font-medium">
                         {selectedDeviceIds.size === devices.length ? 'Снять все' : 'Выбрать все'}
                       </button>
                    </div>
                    {devices.length === 0 && <p className="text-xs text-gray-400 p-2">Нет устройств</p>}
                    {devices.map(dev => (
                      <div key={dev.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer border-b border-transparent hover:border-slate-100 last:border-0" onClick={() => toggleDeviceSelection(dev.id)}>
                        {selectedDeviceIds.has(dev.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                        <span className="text-xs font-mono truncate w-full">{dev.deviceModel} <span className="text-gray-400">| {dev.clientName}</span></span>
                      </div>
                    ))}
                 </div>
               )}
             </div>
           )}

           {/* Config: ACTS */}
           {printMode === 'acts' && (
             <div className="flex flex-wrap gap-4 items-end">
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Тип документа</label>
                   <select 
                     value={actType} 
                     onChange={(e) => setActType(e.target.value as ActType)}
                     className="border border-gray-300 rounded p-1.5 bg-white w-56 text-sm"
                   >
                     <option value="diagnosis">Акт диагностики / Приема</option>
                     <option value="works">Акт выполненных работ</option>
                     <option value="issue">Акт выдачи</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Копий (2 на лист)</label>
                   <input 
                     type="number" 
                     min="1" 
                     max="20" 
                     value={actCount} 
                     onChange={(e) => setActCount(parseInt(e.target.value) || 1)}
                     className="border border-gray-300 rounded p-1.5 w-20 text-center text-sm"
                   />
                </div>
             </div>
           )}

           {/* Config: SEALS */}
           {printMode === 'seals' && (
             <p className="text-xs text-gray-500">Автоматическая раскладка: 25 пломб (5x5) на листе A4. Рекомендуется самоклеящаяся бумага.</p>
           )}
        </div>
      </div>

      {/* Preview Area (Visible on Screen) & Print Area */}
      {/* Added ID printable-root for targeted print styles */}
      <div className="flex-1 p-4 md:p-8 overflow-auto print:p-0 print:overflow-visible flex justify-center bg-gray-100 print:bg-white print:block">
        <div id="printable-root" className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-[10mm] print:shadow-none print:p-0 print:w-full print:min-h-0 transition-all origin-top scale-90 md:scale-100 print:scale-100">
          {printMode === 'seals' && renderSeals()}
          {printMode === 'tags' && renderTags()}
          {printMode === 'acts' && renderActs()}
        </div>
      </div>
    </div>
  );
};