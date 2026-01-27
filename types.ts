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
  CAPACITOR = 'Конденсатор',
  RESISTOR = 'Резистор',
  DIODE = 'Диод',
  TRANSISTOR = 'Транзистор',
  LED = 'Светодиод',
  CHIP = 'Микросхема',
  OTHER = 'Другое'
}

export interface SparePart {
  id: string;
  name: string;
  type: PartType;
  quantity: number;
  inStock: boolean; // true = in stock, false = to buy
}

export type ViewState = 'repair' | 'inventory' | 'print' | 'ai_chat';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}