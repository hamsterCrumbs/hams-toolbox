import type { IPlugin, DataEnvelope } from '../core/types';

export interface VTSParamSetting {
  min: number;
  max: number;
  def: number;
  expose: boolean;
}

export class VTSOutputPlugin implements IPlugin {
  id: string;
  name: string;
  private expectedInputs: Map<string, any>;
  private outputs: Map<string, DataEnvelope>;
  public paramSettings: Map<string, VTSParamSetting>;
  private inputCounter = 1;

  constructor() {
    this.id = 'vts_out_' + Math.random().toString(36).substring(2, 9);
    this.name = 'VTS Output';
    this.expectedInputs = new Map();
    this.outputs = new Map();
    this.paramSettings = new Map();
    this.addInput();
  }

  registerInput = (inputId: string, expectedType: 'SINGLE' | 'BUNDLE' | 'ANY'): void => {
    this.expectedInputs.set(inputId, expectedType);
  }

  getExpectedInputs = (): any => {
    return this.expectedInputs as any;
  }

  getOutputs = () => {
    return this.outputs;
  }
  
  addInput = () => {
    const name = `vts_in_${this.inputCounter++}`;
    this.expectedInputs.set(name, 'ANY');
    return name;
  }

  removeInput = (name: string) => {
    this.expectedInputs.delete(name);
    this.paramSettings.delete(name);
    for (const key of this.paramSettings.keys()) {
      if (key.startsWith(`${name}_`)) {
        this.paramSettings.delete(key);
      }
    }
  }

  process = (inputs: Map<string, DataEnvelope>) => {
    return this.outputs || new Map();
  }
}