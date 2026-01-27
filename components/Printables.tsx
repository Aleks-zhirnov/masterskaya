import React, { useState } from 'react';
import { Device } from '../types';
import { Printer, Scissors } from 'lucide-react';

interface PrintablesProps {
  devices: Device[];
}

export const Printables: React.FC<PrintablesProps> = ({ devices }) => {
  const [printMode, setPrintMode] = useState<'seals' | 'tags'>('seals');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Control Panel - Hidden on Print */}
      <div className="no-print bg-white p-6 shadow rounded-lg mb-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Printer className="w-6 h-6" />
          Студия Печати
        </h2>
        <p className="text-gray-600 mb-6">
          Выберите тип документа для печати, затем нажмите кнопку печати. 
          При печати интерфейс программы будет скрыт.
        </p>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setPrintMode('seals')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              printMode === 'seals' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Гарантийные пломбы
          </button>
          <button
            onClick={() => setPrintMode('tags')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              printMode === 'tags' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Бирки для устройств
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95"
        >
          <Printer className="w-5 h-5" />
          Распечатать (Ctrl+P)
        </button>
      </div>

      {/* Preview Area (Visible on Screen) & Print Area (Visible on Print) */}
      <div className="bg-white p-8 border border-gray-300 shadow-inner min-h-[500px] overflow-auto print:border-none print:shadow-none print:p-0 print:overflow-visible">
        
        {/* SEALS LAYOUT */}
        {printMode === 'seals' && (
          <div className="grid grid-cols-4 gap-4 print:grid-cols-5 print:gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="border-2 border-red-600 p-2 w-full aspect-[2/1] flex flex-col items-center justify-center bg-white relative">
                <div className="absolute top-0 left-0 w-full h-full border-2 border-red-600 opacity-20 pointer-events-none"></div>
                <div className="text-[10px] font-bold text-red-700 uppercase tracking-widest text-center">
                  ОПЕЧАТАНО
                </div>
                <div className="text-[8px] text-red-600 text-center mb-1">
                  НЕ ВСКРЫВАТЬ
                </div>
                <div className="w-full flex items-end justify-center gap-1 mt-1">
                  <span className="text-[8px] text-red-800 font-bold">ДАТА:</span>
                  <div className="border-b border-red-800 w-16 h-3"></div>
                </div>
                <div className="text-[7px] text-red-500 mt-1 text-center leading-tight">
                  При повреждении гарантия аннулируется
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAGS LAYOUT */}
        {printMode === 'tags' && (
          <div className="grid grid-cols-2 gap-8 print:block print:gap-0">
            {/* Logic: If we have active devices, create tags for them. If not, show blanks. */}
            {(devices.length > 0 ? devices : Array.from({ length: 4 })).map((device: any, i) => (
              <div key={i} className="border-4 border-dashed border-gray-400 p-4 mb-4 bg-white relative print:mb-8 print:break-inside-avoid">
                <div className="absolute top-2 right-2 text-gray-300">
                  <Scissors className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-bold text-center border-b-2 border-black pb-2 mb-4 uppercase">
                  Квитанция на ремонт
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="font-bold min-w-[80px]">Устройство:</span>
                    <div className="border-b border-gray-400 flex-grow font-mono text-lg pl-2">
                      {device?.deviceModel || ''}
                    </div>
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <span className="font-bold min-w-[80px]">Владелец:</span>
                    <div className="border-b border-gray-400 flex-grow font-mono text-lg pl-2">
                      {device?.clientName || ''}
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="font-bold min-w-[80px]">Дата:</span>
                    <div className="border-b border-gray-400 w-40 font-mono text-lg pl-2">
                      {device?.dateReceived ? new Date(device.dateReceived).toLocaleDateString('ru-RU') : ''}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-2">
                    <span className="font-bold">Неисправность / Заметки:</span>
                    <div className="border border-gray-300 h-24 p-2 rounded bg-gray-50">
                       {/* If it's a real device, show info, otherwise blank lines */}
                       {device?.issueDescription ? (
                         <p className="font-mono text-sm">{device.issueDescription}</p>
                       ) : (
                         <div className="flex flex-col gap-4 mt-2">
                           <div className="border-b border-gray-300 w-full"></div>
                           <div className="border-b border-gray-300 w-full"></div>
                           <div className="border-b border-gray-300 w-full"></div>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <div className="text-center">
                      <div className="border-b border-black w-32 mb-1"></div>
                      <span className="text-xs text-gray-500">Подпись мастера</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};