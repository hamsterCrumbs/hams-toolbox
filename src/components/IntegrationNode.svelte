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

  function handleDelete() {
    deleteElements({ nodes: [{ id: data.id }] });
  }
</script>

<div class="node">
  <button class="delete-btn" onclick={handleDelete}>×</button>
  <div class="title">{data.label}</div>
  
  {#if integration && integration.iphoneIp !== undefined}
    <div class="settings">
      <input type="text" class="nodrag" bind:value={integration.iphoneIp} placeholder="iPhone IP" title="iPhone IP" />
      <input type="number" class="nodrag" bind:value={integration.vtsPort} placeholder="Port" title="Port" />
    </div>
  {/if}

  <div class="ports">
    {#each data.outputs as output}
      <div class="port-row output-row">
        <span class="port-label">{output}</span>
        <span class="port-value">{getOutputValue($pool, output)}</span>
        <Handle 
          type="source" 
          position={Position.Right} 
          id={output} 
          class="handle" 
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .node {
    position: relative;
    background-color: #1e293b;
    border: 1px solid #3b82f6;
    border-radius: 8px;
    min-width: 180px;
    color: #f8fafc;
  }
  .title {
    background-color: #3b82f6;
    padding: 8px;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
    font-weight: 600;
    text-align: center;
    font-size: 14px;
  }
  .settings {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-bottom: 1px solid #334155;
  }
  .settings input {
    background: #0f172a;
    border: 1px solid #334155;
    color: #e2e8f0;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 11px;
    width: 100%;
    box-sizing: border-box;
    outline: none;
  }
  .settings input:focus {
    border-color: #3b82f6;
  }
  .ports {
    padding: 10px 0;
  }
  .port-row {
    position: relative;
    padding: 4px 12px;
    display: flex;
    align-items: center;
  }
  .output-row {
    justify-content: flex-end;
  }
  .port-label {
    font-size: 12px;
    color: #cbd5e1;
  }
  .port-value {
    font-size: 10px;
    color: #64748b;
    font-family: monospace;
    margin-left: 8px;
  }
  :global(.svelte-flow__handle) {
    width: 10px !important;
    height: 10px !important;
    min-width: 10px !important;
    min-height: 10px !important;
    border-radius: 50% !important;
    background-color: #60a5fa;
    border: 2px solid #1e293b;
  }
  .delete-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: transparent;
    border: none;
    color: #f8fafc;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    border-radius: 4px;
    padding: 2px 6px;
  }
  .delete-btn:hover {
    background: #ef4444;
  }
</style>