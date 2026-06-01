<script lang="ts">
  import { useSvelteFlow } from '@xyflow/svelte';
  import PluginNode from './PluginNode.svelte';
  import type { VTuberToolboxEngine } from '../core/engine';

  export let data: { label: string; inputs: string[]; outputs: string[]; id: string; engine: VTuberToolboxEngine };

  $: pool = data.engine.dataPool;
  const { updateNodeData } = useSvelteFlow();
  $: plugin = data.engine.getPlugins().find((p) => p.id === data.id);

  // --- Dynamic Input Management (n+1) ---
  $: {
    // 1. Force Svelte to re-evaluate this block continuously by referencing $pool
    const _ = $pool;

    const routes = data.engine.getRoutes().get(data.id) || {};
    
    // 2. Find the highest port index that is currently connected
    let highestIndex = -1;
    for (const [handle, poolKey] of Object.entries(routes)) {
      if (poolKey && poolKey !== '') {
        const idx = parseInt(handle.replace('In_', ''), 10);
        if (!isNaN(idx) && idx > highestIndex) {
          highestIndex = idx;
        }
      }
    }

    // 3. Ensure we always have an empty port at the bottom (highestIndex + 2)
    //    and we never shrink the array, to prevent Svelte Flow from deleting active edges!
    const expectedInputs = Math.max(data.inputs.length, highestIndex + 2);

    if (data.inputs.length < expectedInputs) {
      const newInputs = Array.from({ length: expectedInputs }, (_, i) => `In_${i}`);
      
      // Update the node's handles in the UI
      updateNodeData(data.id, { inputs: newInputs });

      // Dynamically register the new input in the underlying plugin logic
      if (plugin) {
        newInputs.forEach(inputId => {
          if (!plugin.getExpectedInputs().has(inputId)) {
            // Registering as 'BUNDLE' conceptually accepts both types in your current architecture
            plugin.registerInput(inputId, 'BUNDLE'); 
          }
        });
      }
    }
  }

  // --- Parameter State Management ---
  type ParamConfig = { min: number; default: number; max: number; expose: boolean };
  let paramConfigs: Record<string, ParamConfig> = {};

  function initParamConfig(id: string) {
    if (!paramConfigs[id]) {
      paramConfigs[id] = { min: 0, default: 0, max: 1, expose: false };
    }
  }

  // --- Extract Parameters from Pool ---
  $: connectedParams = (() => {
    const _ = $pool; // Force Svelte to evaluate this block on every data tick
    const params: any[] = [];
    const routes = data.engine.getRoutes().get(data.id) || {};
    
    for (const [inputHandle, poolKey] of Object.entries(routes)) {
      if (poolKey && $pool.has(poolKey)) {
        const envelope = $pool.get(poolKey);
        
        if (envelope && envelope.type === 'SINGLE') {
          params.push({ type: 'SINGLE', id: envelope.data.id, data: envelope.data });
          initParamConfig(envelope.data.id);
        } else if (envelope && envelope.type === 'BUNDLE') {
          const bundleParams = Array.from(envelope.data.parameters.values());
          params.push({ type: 'BUNDLE', id: envelope.data.id, groupName: envelope.data.groupName, parameters: bundleParams });
          bundleParams.forEach(p => initParamConfig(p.id));
        }
      }
    }
    return params;
  })();

  // --- VTube Studio API Integration ---
  function handleConfigChange(paramId: string) {
    paramConfigs = { ...paramConfigs }; // Trigger Svelte reactivity
    
    const config = paramConfigs[paramId];
    if (!config.expose) return;

    // Locate the VTS desktop integration inside the engine
    const vtsDesktop: any = data.engine.getIntegrations().find(i => 
      i.name.includes('VTubeStudio') || i.constructor.name === 'VTubeStudioDesktop'
    );

    if (vtsDesktop && vtsDesktop.isConnected && vtsDesktop.apiClient) {
      // Dispatch standard Custom Parameter creation to VTube Studio API
      vtsDesktop.apiClient.parameterCreation({
        parameterName: paramId,
        explanation: "Exposed by Ham's VTuber Toolbox",
        min: config.min,
        max: config.max,
        defaultValue: config.default
      }).catch((err: any) => console.error(`Failed to create VTS Parameter [${paramId}]:`, err));
    } else {
      console.warn("Cannot expose parameter: VTubeStudio Desktop is not connected.");
    }
  }
</script>

<PluginNode {data}>
  <div class="settings nodrag">
    <div class="settings-title">VTS Custom Parameters</div>
    
    <div class="param-list">
      {#if connectedParams.length === 0}
        <span class="no-params">Connect single or bundle parameters...</span>
      {/if}

      {#each connectedParams as item}
        {#if item.type === 'SINGLE'}
          <div class="param-row single-param">
            <span class="param-name" title={item.id}>{item.id}</span>
            <div class="param-controls">
              <input type="number" step="0.1" bind:value={paramConfigs[item.id].min} onchange={() => handleConfigChange(item.id)} title="Min" />
              <input type="number" step="0.1" bind:value={paramConfigs[item.id].default} onchange={() => handleConfigChange(item.id)} title="Default" />
              <input type="number" step="0.1" bind:value={paramConfigs[item.id].max} onchange={() => handleConfigChange(item.id)} title="Max" />
              <input type="checkbox" bind:checked={paramConfigs[item.id].expose} onchange={() => handleConfigChange(item.id)} title="Expose to VTube Studio" />
            </div>
          </div>
        {:else if item.type === 'BUNDLE'}
          <div class="bundle-header">
            <span class="bundle-name">📦 {item.groupName || item.id}</span>
          </div>
          {#each item.parameters as p}
            <div class="param-row bundle-param">
              <span class="param-name" title={p.id}>↳ {p.id}</span>
              <div class="param-controls">
                <input type="number" step="0.1" bind:value={paramConfigs[p.id].min} onchange={() => handleConfigChange(p.id)} title="Min" />
                <input type="number" step="0.1" bind:value={paramConfigs[p.id].default} onchange={() => handleConfigChange(p.id)} title="Default" />
                <input type="number" step="0.1" bind:value={paramConfigs[p.id].max} onchange={() => handleConfigChange(p.id)} title="Max" />
                <input type="checkbox" bind:checked={paramConfigs[p.id].expose} onchange={() => handleConfigChange(p.id)} title="Expose to VTube Studio" />
              </div>
            </div>
          {/each}
        {/if}
      {/each}
    </div>
  </div>
</PluginNode>

<style>
  .settings {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-bottom: 1px solid #3b82f6; /* A distinct blue for output nodes */
  }
  .settings-title {
    font-size: 11px;
    font-weight: 600;
    color: #cbd5e1;
  }
  .param-list {
    max-height: 220px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #0f172a;
    padding: 6px;
    border: 1px solid #334155;
    border-radius: 4px;
  }
  .no-params {
    font-size: 10px;
    color: #64748b;
    font-style: italic;
  }
  
  /* Row Layouts */
  .param-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
    padding-bottom: 4px;
  }
  .param-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .bundle-header {
    font-size: 11px;
    font-weight: bold;
    color: #93c5fd; /* Bundle theme color */
    margin-top: 4px;
    border-bottom: 1px solid #334155;
    padding-bottom: 2px;
  }
  .bundle-param {
    padding-left: 12px; /* Indent for unbundled readability */
  }
  .param-name {
    font-size: 10px;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70px;
  }
  
  /* Inputs */
  .param-controls {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .param-controls input[type="number"] {
    background: #1e293b;
    border: 1px solid #334155;
    color: #e2e8f0;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 10px;
    width: 36px;
    box-sizing: border-box;
    outline: none;
    text-align: center;
  }
  .param-controls input[type="number"]::-webkit-inner-spin-button,
  .param-controls input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .param-controls input[type="number"]:focus {
    border-color: #3b82f6;
  }
  .param-controls input[type="checkbox"] {
    cursor: pointer;
    margin: 0;
    accent-color: #3b82f6;
  }
</style>