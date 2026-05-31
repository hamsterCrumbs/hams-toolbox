import type { IIntegration, IPlugin, DataEnvelope } from './types';

export class MockHeartMonitor implements IIntegration {
  id = 'int_heart01';
  name = 'Fake Heart Monitor';
  isConnected = false;
  private currentBpm = 70;
  private outputs = new Map<string, DataEnvelope>();

  async connect() {
    this.isConnected = true;
    return true;
  }

  async disconnect() {
    this.isConnected = false;
  }

  poll() {
    // Simulate heart rate fluctuating between 60 and 120
    this.currentBpm += (Math.random() * 6 - 2.5); 
    if (this.currentBpm < 60) this.currentBpm = 60;
    if (this.currentBpm > 120) this.currentBpm = 120;

    this.outputs.set('bpm', {
      type: 'SINGLE',
      data: { id: 'bpm', value: Math.round(this.currentBpm), min: 0, max: 250 }
    });
  }

  getOutputs() { return this.outputs; }
}

export class PanicTriggerPlugin implements IPlugin {
  id = 'plug_panic01';
  name = 'Panic Trigger';
  private outputs = new Map<string, DataEnvelope>();

  registerInput(inputId: string, expectedType: 'SINGLE' | 'BUNDLE') {}

  process(inputs: Map<string, DataEnvelope>) {
    const hrData = inputs.get('heartRateInput');
    let isPanicking = false;

    if (hrData && hrData.type === 'SINGLE') {
      isPanicking = (hrData.data.value as number) > 100;
    }

    this.outputs.set('panicState', {
      type: 'SINGLE',
      data: { id: 'panicState', value: isPanicking }
    });

    return this.outputs;
  }

  getOutputs() { return this.outputs; }
}