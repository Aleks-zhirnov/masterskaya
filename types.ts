export enum DeviceStatus {
  RECEIVED = 'Принят',
  IN_PROGRESS = 'В работе',
  WAITING_PARTS = 'Ждем запчасти',
  READY = 'Готов',
  ISSUED = 'Выдан'
}

export enum Urgency {
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Device {
  id: string;
  clientName: string;
  clientPhone?: string;
  deviceModel: string;
  issueDescription: string;
  dateReceived: string; // ISO string
  status: DeviceStatus;
  urgency: Urgency;
  estimatedCost?: number;
  notes?: string;
  statusChangedAt?: string; // ISO string, для автоудаления
  isPlanned?: boolean; // План на завтра
  isArchived?: boolean;
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

export type ViewState = 'repair' | 'inventory' | 'print' | 'ai_chat' | 'references' | 'knowledge' | 'planning' | 'archive';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}