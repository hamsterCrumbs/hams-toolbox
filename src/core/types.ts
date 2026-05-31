export interface Parameter<T = number | string | boolean> {
  id: string;
  value: T;
  min?: number;
  max?: number;
  default?: T;
}

export interface ParameterBundle {
  id: string;
  groupName: string;
  parameters: Map<string, Parameter<any>>;
}

export type DataEnvelope = 
  | { type: 'SINGLE'; data: Parameter<any> }
  | { type: 'BUNDLE'; data: ParameterBundle };

export interface IIntegration {
  id: string;
  name: string;
  isConnected: boolean;
  
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  reconnect?(): Promise<boolean>;
  poll(): void;
  getOutputs(): Map<string, DataEnvelope>;
}

export interface IPlugin {
  id: string;
  name: string;
  
  registerInput(inputId: string, expectedType: 'SINGLE' | 'BUNDLE'): void;
  getExpectedInputs(): Map<string, 'SINGLE' | 'BUNDLE'>;
  process(inputs: Map<string, DataEnvelope>): Map<string, DataEnvelope>;
  getOutputs(): Map<string, DataEnvelope>;
}