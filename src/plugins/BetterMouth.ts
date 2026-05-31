import type { DataEnvelope, IPlugin } from "../core/types";


export class BetterMouthPlugin implements IPlugin {
  id = 'plugin_bettermouth_' + Math.random().toString(36).substring(2, 9);
  name = 'BetterMouth';

  private expectedInputs = new Map<string, 'SINGLE' | 'BUNDLE'>();
  private outputs = new Map<string, DataEnvelope>();

  constructor() {
    // Register the input we expect from the VTS node
    this.registerInput('ARKit', 'BUNDLE');

    // Pre-initialize our 2 new output parameters
    this.outputs.set('mouthOpen', { type: 'SINGLE', data: { id: 'mouthOpen', value: 0 } });
    this.outputs.set('mouthSmile', { type: 'SINGLE', data: { id: 'mouthSmile', value: 0 } });
  }

  registerInput(inputId: string, expectedType: 'SINGLE' | 'BUNDLE'): void {
    this.expectedInputs.set(inputId, expectedType);
  }

  getExpectedInputs(): Map<string, 'SINGLE' | 'BUNDLE'> {
    return this.expectedInputs;
  }

  process(inputs: Map<string, DataEnvelope>): Map<string, DataEnvelope> {
    const arkitEnvelope = inputs.get('ARKit');

    let mouthOpenValue = 0;
    let mouthSmileValue = 0;

    if (arkitEnvelope && arkitEnvelope.type === 'BUNDLE') {
      const arkit = arkitEnvelope.data.parameters;

      mouthOpenValue = arkit.get('JawOpen')!.value - arkit.get('MouthClose')!.value;
      mouthSmileValue = 0;

    }

    // Mutate and return our outputs
    (this.outputs.get('mouthOpen')!.data as any).value = mouthOpenValue;
    (this.outputs.get('mouthSmile')!.data as any).value = mouthSmileValue;

    return this.outputs;
  }

  getOutputs(): Map<string, DataEnvelope> {
    return this.outputs;
  }
}