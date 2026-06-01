<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import type { VTuberToolboxEngine } from '../core/engine';
  
  export let data: { label: string; inputs: string[]; outputs: string[]; id: string; engine: VTuberToolboxEngine };

  $: pool = data.engine.dataPool;
  
  const { deleteElements, updateNodeData } = useSvelteFlow();

  $: plugin = data.engine.getPlugins().find((p) => p.id === data.id);
  
  // Reactive block specifically for the Extract Plugin
  // Referencing $pool forces Svelte to re-evaluate the route when new connections are established
  $: bundlePoolKey = (plugin?.name === 'Extract' && $pool) ? data.engine.getRoute(data.id, 'BundleIn') : null;
  $: connectedBundle = bundlePoolKey && $pool.has(bundlePoolKey) ? $pool.get(bundlePoolKey) : null;
  $: availableParams = connectedBundle && connectedBundle.type === 'BUNDLE' 
    ? Array.from(connectedBundle.data.parameters.keys()) 
    : [];
  
  function toggleExtractParam(paramName: string) {
    if (plugin && plugin.name === 'Extract') {
      (plugin as any).toggleParam(paramName);
      updateNodeData(data.id, { outputs: Array.from(plugin.getOutputs().keys()) });
    }
  }

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

  function handleDelete() {
    deleteElements({ nodes: [{ id: data.id }] });
  }
</script>

<div class="node" style="--theme-color: #10b981; --handle-size: 12px;">
  <button class="delete-btn" onclick={handleDelete}>×</button>
  <div class="title">{data.label}</div>
  
  <slot />

  <div class="ports">
    <!-- Inputs on the Left -->
    {#each data.inputs as input (input)}
      <div class="port-row input-row">
        <Handle 
          type="target" 
          position={Position.Left} 
          id={input} 
          class="handle {isBundleInput(input) ? 'bundle-handle' : ''}" 
        />
        <span class="port-value">{getInputValue($pool, input)}</span>
        <span class="port-label">{input}</span>
      </div>
    {/each}

    <!-- Outputs on the Right -->
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