<script lang="ts">
  import { useSvelteFlow } from '@xyflow/svelte';
  import PluginNode from './PluginNode.svelte';

  export let data: { label: string; inputs: string[]; outputs: string[]; id: string; engine: any };

  $: pool = data.engine.dataPool;
  const { updateNodeData, edges } = useSvelteFlow() as any;
  
  $: plugin = data.engine.getPlugins().find((p: any) => p.id === data.id);

  $: bundlePoolKey = (plugin?.name === 'Extract' && $edges) ? data.engine.getRoute(data.id, 'BundleIn') : null;
  
  $: connectedBundle = (() => {
    if (!bundlePoolKey) return null;
    const [sourceId, ...outputParts] = bundlePoolKey.split('.');
    const sourceOutput = outputParts.join('.');

    const sourcePlugin = data.engine.getPlugins().find((p: any) => p.id === sourceId);
    if (sourcePlugin && typeof sourcePlugin.getOutputs === 'function') {
      return sourcePlugin.getOutputs().get(sourceOutput);
    }

    const sourceIntegration = data.engine.getIntegrations().find((i: any) => i.id === sourceId);
    if (sourceIntegration && typeof sourceIntegration.getOutputs === 'function') {
      return sourceIntegration.getOutputs().get(sourceOutput);
    }

    return null;
  })();

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
    <div class="node-settings nodrag">
      <div class="node-settings-title">Select Parameters:</div>
      <div class="extract-param-list">
        {#if availableParams.length === 0}
          <span class="extract-no-bundle">Connect a bundle first...</span>
        {/if}
        {#each availableParams as paramName}
          <label class="extract-param-label">
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