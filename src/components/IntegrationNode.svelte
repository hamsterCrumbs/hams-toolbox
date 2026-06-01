<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import type { VTuberToolboxEngine } from '../core/engine';
  
  export let data: { label: string; outputs: string[]; id: string; engine: VTuberToolboxEngine };
  
  $: pool = data.engine.dataPool;
  
  const { deleteElements } = useSvelteFlow();
  
  // Find the actual integration instance so we can bind to its public properties
  $: integration = data.engine.getIntegrations().find((i) => i.id === data.id) as any;

  function getOutputValue(poolState: Map<string, any>, output: string) {
    const key = `${data.id}.${output}`;
    
    // Check the engine pool first, fallback to the integration's default outputs
    let envelope = poolState.get(key);
    if (!envelope && integration && typeof integration.getOutputs === 'function') {
      envelope = integration.getOutputs().get(output);
    }

    if (envelope && envelope.type === 'SINGLE') {
      return Number(envelope.data.value).toFixed(2);
    }
    if (envelope && envelope.type === 'BUNDLE') {
      return `${envelope.data.parameters.size} P`;
    }

    return "0.00";
  }

  function isBundleOutput(output: string) {
    if (integration && typeof integration.getOutputs === 'function') {
      const envelope = integration.getOutputs().get(output);
      return envelope && envelope.type === 'BUNDLE';
    }
    return false;
  }

  function handleDelete() {
    deleteElements({ nodes: [{ id: data.id }] });
  }
</script>

<div class="node" style="--theme-color: #3b82f6; --handle-size: 10px;">
  <button class="delete-btn" onclick={handleDelete}>×</button>
  <div class="title">{data.label}</div>
  
  <slot />

  <div class="ports">
    {#each data.outputs as output (output)}
      <div class="port-row output-row">
        <span class="port-label">{output}</span>
        <span class="port-value">{getOutputValue($pool, output)}</span>
        <Handle 
          type="source" 
          position={Position.Right} 
          id={output} 
          class="handle {isBundleOutput(output) ? 'bundle-handle' : ''}" 
        />
      </div>
    {/each}
  </div>
</div>