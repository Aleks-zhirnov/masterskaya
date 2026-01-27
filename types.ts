export enum DeviceStatus {
  RECEIVED = 'Принят',
  IN_PROGRESS = 'В работе',
  WAITING_PARTS = 'Ждем запчасти',
  READY = 'Готов',
  ISSUED = 'Выдан'
}

export interface Device {
  id: string;
  clientName: string;
  deviceModel: string;
  issueDescription: string;
  dateReceived: string; // ISO string
  status: DeviceStatus;
  notes?: string;
}

export enum PartType {
  CAPACITOR = 'Конденсаторы',
  RESISTOR = 'Резисторы',
  DIODE = 'Диоды',
  TRANSISTOR = 'Транзисторы',
  LED = 'Светодиоды',
  CHIP = 'Микросхемы',
  CONNECTOR = 'Разъемы',
  SWITCH = 'Кнопки/Перекл.',
  FUSE = 'Предохранители',
  MODULE = 'Готовые модули',
  OTHER = 'Разное'
}

export interface SparePart {
  id: string;
  name: string;
  type: PartType;
  subtype?: string; // Subcategory (e.g., "Electrolytic", "SMD 0805")
  quantity: number;
  inStock: boolean; // true = in stock, false = to buy
}

export type ViewState = 'repair' | 'inventory' | 'print' | 'ai_chat';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}