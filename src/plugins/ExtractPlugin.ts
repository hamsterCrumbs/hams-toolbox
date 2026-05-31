import type { DataEnvelope, IPlugin } from "../core/types";

export class ExtractPlugin implements IPlugin {
  id = 'plugin_extract_' + Math.random().toString(36).substring(2, 9);
  name = 'Extract';

  private expectedInputs = new Map<string, 'SINGLE' | 'BUNDLE'>();
  private outputs = new Map<string, DataEnvelope>();
  
  public selectedParams: string[] = [];

  constructor() {
    // Register the input we expect from a VTS node (or any other bundle provider)
    this.registerInput('BundleIn', 'BUNDLE');
  }

  registerInput(inputId: string, expectedType: 'SINGLE' | 'BUNDLE'): void {
    this.expectedInputs.set(inputId, expectedType);
  }

  getExpectedInputs(): Map<string, 'SINGLE' | 'BUNDLE'> {
    return this.expectedInputs;
  }

  process(inputs: Map<string, DataEnvelope>): Map<string, DataEnvelope> {
    const bundleEnv = inputs.get('BundleIn');

    if (bundleEnv && bundleEnv.type === 'BUNDLE') {
      const params = bundleEnv.data.parameters;

      // Populate our selected outputs with the live values from the bundle
      for (const paramId of this.selectedParams) {
        const outEnv = this.outputs.get(paramId);
        const paramData = params.get(paramId);
        if (outEnv && outEnv.type === 'SINGLE') {
           outEnv.data.value = paramData ? paramData.value : 0;
        }
      }
    }
    return this.outputs;
  }

  getOutputs(): Map<string, DataEnvelope> {
    return this.outputs;
  }

  public toggleParam(paramId: string) {
    if (this.selectedParams.includes(paramId)) {
      this.selectedParams = this.selectedParams.filter(p => p !== paramId);
      this.outputs.delete(paramId);
    } else {
      this.selectedParams.push(paramId);
      this.outputs.set(paramId, { type: 'SINGLE', data: { id: paramId, value: 0 } });
    }
  }
}