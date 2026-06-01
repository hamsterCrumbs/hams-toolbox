<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import type { VTuberToolboxEngine } from '../core/engine';
  
  export let data: { label: string; inputs: string[]; outputs: string[]; id: string; engine: VTuberToolboxEngine };

  $: pool = data.engine.dataPool;
  
  const { deleteElements, updateNodeData, edges } = useSvelteFlow() as any;

  $: plugin = data.engine.getPlugins().find((p) => p.id === data.id);
  

  function getInputValue(poolState: Map<string, any>, input: string, _edges?: any[]) {
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
    
    if (plugin && (plugin.getExpectedInputs().get(input) as string) === 'ANY') {
      return "";
    }

    return "0.00";
  }

  function getOutputValue(poolState: Map<string, any>, output: string, _edges?: any[]) {
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

  function isBundleInput(input: string) {
    return plugin && plugin.getExpectedInputs().get(input) === 'BUNDLE';
  }

  function isBundleOutput(output: string) {
    if (plugin && typeof plugin.getOutputs === 'function') {
      const envelope = plugin.getOutputs().get(output);
      return envelope && envelope.type === 'BUNDLE';
    }
    return false;
  }

  function isAnyInput(input: string) {
    return plugin && (plugin.getExpectedInputs().get(input) as string) === 'ANY';
  }

  function getInputName(input: string, _edges?: any[]) {
    if (isAnyInput(input)) {
      const poolKey = data.engine.getRoute(data.id, input);
      if (poolKey) {
        return poolKey.split('.').slice(1).join('.') || poolKey;
      }
      return "";
    }
    return input;
  }

  function handleDelete() {
    deleteElements({ nodes: [{ id: data.id }] });
  }
</script>

<div class="node plugin-node">
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
          class="handle {isBundleInput(input) ? 'bundle-handle' : isAnyInput(input) ? 'any-handle' : ''}" 
        />
        {#if !isAnyInput(input)}
          <span class="port-value">{getInputValue($pool, input, $edges)}</span>
        {/if}
        <span class="port-label">{getInputName(input, $edges)}</span>
      </div>
    {/each}

    <!-- Outputs on the Right -->
    {#each data.outputs as output}
      <div class="port-row output-row">
        <span class="port-label">{output}</span>
        <span class="port-value">{getOutputValue($pool, output, $edges)}</span>
        <Handle 
          type="source" 
          position={Position.Right} 
          id={output} 
          class="handle {isBundleOutput(output) ? 'bundle-handle' : ''}" 
        />
      </div>
    {/each}
  </div>

  <slot />
</div>