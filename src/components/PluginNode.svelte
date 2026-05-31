<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import type { VTuberToolboxEngine } from '../core/engine';
  
  export let data: { label: string; inputs: string[]; outputs: string[]; id: string; engine: VTuberToolboxEngine };

  $: pool = data.engine.dataPool;
  
  const { deleteElements } = useSvelteFlow();

  $: plugin = data.engine.getPlugins().find((p) => p.id === data.id);

  function getInputValue(poolState: Map<string, any>, input: string) {
    // 1. Ask the engine what pool key is routed into this specific input
    const poolKey = data.engine.getRoute(data.id, input);
    
    // 2. Fetch it from the pool if it exists
    if (poolKey && poolState.has(poolKey)) {
      const envelope = poolState.get(poolKey);
      if (envelope && envelope.type === 'SINGLE') {
        return Number(envelope.data.value).toFixed(2);
      }
      if (envelope && envelope.type === 'BUNDLE') {
        return "";
      }
    }

    // If unconnected, check if it expects a bundle to keep it blank
    if (plugin && plugin.getExpectedInputs().get(input) === 'BUNDLE') {
      return "";
    }

    return "0.00";
  }

  function getOutputValue(poolState: Map<string, any>, output: string) {
    const key = `${data.id}.${output}`;
    
    let envelope = poolState.get(key);
    if (!envelope && plugin && typeof plugin.getOutputs === 'function') {
      envelope = plugin.getOutputs().get(output);
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
  
  <div class="ports">
    <!-- Inputs on the Left -->
    {#each data.inputs as input}
      <div class="port-row input-row">
        <Handle 
          type="target" 
          position={Position.Left} 
          id={input} 
          class="handle" 
        />
        <span class="port-value">{getInputValue($pool, input)}</span>
        <span class="port-label">{input}</span>
      </div>
    {/each}

    <!-- Outputs on the Right -->
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
    border: 1px solid #10b981;
    border-radius: 8px;
    min-width: 180px;
    color: #f8fafc;
  }
  .title {
    background-color: #10b981;
    padding: 8px;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
    font-weight: 600;
    text-align: center;
    font-size: 14px;
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
  .input-row {
    justify-content: flex-start;
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
  }
  .input-row .port-value {
    margin-right: 8px;
  }
  .output-row .port-value {
    margin-left: 8px;
  }
  :global(.handle) {
    width: 12px !important;
    height: 12px !important;
    min-width: 12px !important;
    min-height: 12px !important;
    border-radius: 50% !important;
    background-color: #34d399;
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