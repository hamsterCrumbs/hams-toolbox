<script lang="ts">
  import { useSvelteFlow } from '@xyflow/svelte';
  import PluginNode from './PluginNode.svelte';

  export let data: { label: string; inputs: string[]; outputs: string[]; id: string; engine: any };

  $: pool = data.engine.dataPool;
  const { updateNodeData } = useSvelteFlow();
  
  $: plugin = data.engine.getPlugins().find((p: any) => p.id === data.id);

  $: bundlePoolKey = (plugin?.name === 'Extract' && $pool) ? data.engine.getRoute(data.id, 'BundleIn') : null;
  $: connectedBundle = bundlePoolKey && $pool.has(bundlePoolKey) ? $pool.get(bundlePoolKey) : null;
  $: availableParams = connectedBundle && connectedBundle.type === 'BUNDLE' 
    ? Array.from(connectedBundle.data.parameters.keys()) as string[]
    : [];

  function toggleExtractParam(paramName: string) {
    if (plugin && plugin.name === 'Extract') {
      (plugin as any).toggleParam(paramName);
      updateNodeData(data.id, { outputs: Array.from(plugin.getOutputs().keys()) });
    }
  }
</script>

<PluginNode {data}>
  {#if plugin && plugin.name === 'Extract'}
    <div class="settings nodrag">
      <div class="settings-title">Select Parameters:</div>
      <div class="param-list">
        {#if availableParams.length === 0}
          <span class="no-bundle">Connect a bundle first...</span>
        {/if}
        {#each availableParams as paramName}
          <label class="param-label">
            <input 
              type="checkbox" 
              checked={(plugin as any).selectedParams.includes(paramName)}
              onchange={() => toggleExtractParam(paramName)}
            />
            {paramName}
          </label>
        {/each}
      </div>
    </div>
  {/if}
</PluginNode>

<style>
  .settings {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-bottom: 1px solid #10b981;
  }
  .settings-title {
    font-size: 11px;
    font-weight: 600;
    color: #cbd5e1;
  }
  .param-list {
    max-height: 120px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #0f172a;
    padding: 6px;
    border: 1px solid #334155;
    border-radius: 4px;
  }
  .param-label {
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #e2e8f0;
    cursor: pointer;
  }
  .no-bundle {
    font-size: 10px;
    color: #64748b;
    font-style: italic;
  }
</style>