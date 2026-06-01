import type { DataEnvelope, IPlugin } from '../core/types';
import type { VTuberToolboxEngine } from '../core/engine';

export class VTSOutputPlugin implements IPlugin {
  public id: string = 'plugin_vtsout_' + Math.random().toString(36).substring(2, 9);
  public name: string = 'VTS Output';
  
  private engine: VTuberToolboxEngine;
  private expectedInputs: Map<string, 'SINGLE' | 'BUNDLE'> = new Map();

  constructor(engine: VTuberToolboxEngine) {
    this.engine = engine;
    
    // Pre-register the first dynamic port
    this.registerInput('In_0', 'BUNDLE');
  }

  // --- Registration ---
  
  public registerInput(inputId: string, expectedType: 'SINGLE' | 'BUNDLE'): void {
    this.expectedInputs.set(inputId, expectedType);
  }

  public getExpectedInputs(): Map<string, 'SINGLE' | 'BUNDLE'> {
    return this.expectedInputs;
  }

  // --- Runtime Execution ---

  public process(inputs: Map<string, DataEnvelope>): Map<string, DataEnvelope> {
    const parameterValues: { id: string; value: number; weight: number }[] = [];

    // 1. Extract and flatten all incoming data connected to this node
    for (const envelope of inputs.values()) {
      if (envelope.type === 'SINGLE') {
        parameterValues.push({
          id: envelope.data.id,
          value: Number(envelope.data.value) || 0,
          weight: 1
        });
      } else if (envelope.type === 'BUNDLE') {
        for (const param of envelope.data.parameters.values()) {
          parameterValues.push({
            id: param.id,
            value: Number(param.value) || 0,
            weight: 1
          });
        }
      }
    }

    // 2. Inject live values into VTube Studio
    if (parameterValues.length > 0) {
      // Fetch the VTS Integration from the central engine
      const vtsIntegration = this.engine.getIntegrations().find(
        (i) => i.name.includes('VTubeStudio') || i.constructor.name === 'VTubeStudioDesktop'
      ) as any;

      if (vtsIntegration && vtsIntegration.isConnected && vtsIntegration.apiClient) {
        // Use the VTS API to push live parameter data
        vtsIntegration.apiClient.injectParameterData({
          faceFound: false, // Set to false as we are injecting raw numeric overrides
          mode: "set",
          parameterValues: parameterValues
        }).catch((err: any) => {
          // Catch silently to prevent flooding the console on every engine tick
          // if VTS momentarily hangs or rejects a packet.
        });
      }
    }

    // 3. This is a sink node (Output to VTS), so we return an empty map to the engine pool
    return new Map();
  }

  public getOutputs(): Map<string, DataEnvelope> {
    return new Map();
  }
}