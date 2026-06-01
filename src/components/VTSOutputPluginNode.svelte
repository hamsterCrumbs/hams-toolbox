<script lang="ts">
  import { useSvelteFlow } from '@xyflow/svelte';
  import PluginNode from './PluginNode.svelte';

  export let data: { label: string; inputs: string[]; outputs: string[]; id: string; engine: any };

  $: pool = data.engine.dataPool;
  const { updateNodeData, edges: flowEdges } = useSvelteFlow() as any;
  
  $: plugin = data.engine.getPlugins().find((p: any) => p.id === data.id);

  // Auto-spawn an input if the last one gets connected
  $: {
    if (plugin && plugin.name === 'VTS Output' && $flowEdges) {
      const inputs = Array.from(plugin.getExpectedInputs().keys());
      const unconnected = inputs.filter(input => !data.engine.getRoute(data.id, input));
      
      let changed = false;
      if (unconnected.length > 1) {
        for (let i = 0; i < unconnected.length - 1; i++) {
          plugin.removeInput(unconnected[i]);
        }
        changed = true;
      } else if (unconnected.length === 0) {
        plugin.addInput();
        changed = true;
      }
      if (changed) {
        updateNodeData(data.id, { inputs: Array.from(plugin.getExpectedInputs().keys()) });
      }
    }
  }

  $: connectedData = ($flowEdges && data.inputs) ? data.inputs.map((input: string) => {
    const route = data.engine.getRoute(data.id, input);
    if (!route) return null;
    
    const [sourceId, ...outputParts] = route.split('.');
    const sourceOutput = outputParts.join('.');

    const sourcePlugin = data.engine.getPlugins().find((p: any) => p.id === sourceId);
    const sourceIntegration = data.engine.getIntegrations().find((i: any) => i.id === sourceId);

    const envelope = (sourcePlugin && typeof sourcePlugin.getOutputs === 'function') ? sourcePlugin.getOutputs().get(sourceOutput)
                   : (sourceIntegration && typeof sourceIntegration.getOutputs === 'function') ? sourceIntegration.getOutputs().get(sourceOutput)
                   : null;

    if (!envelope) return null;

    if (envelope.type === 'SINGLE') {
      const settingId = input;
      if (!plugin.paramSettings.has(settingId)) {
        plugin.paramSettings.set(settingId, { min: 0, max: 1, def: 0, expose: true });
      }
      const poolVal = $pool && $pool.has(route) ? $pool.get(route).data.value : envelope.data.value;
      return { 
        type: 'SINGLE', 
        id: input, 
        name: sourceOutput, 
        value: poolVal,
        setting: plugin.paramSettings.get(settingId)
      };
    } else if (envelope.type === 'BUNDLE') {
      const params = Array.from(envelope.data.parameters.entries() as IterableIterator<[string, any]>).map(([k, v]: [string, any]) => {
        const settingId = `${input}_${k}`;
        if (!plugin.paramSettings.has(settingId)) {
          plugin.paramSettings.set(settingId, { min: 0, max: 1, def: 0, expose: true });
        }
        let poolVal = v.value;
        if ($pool && $pool.has(route)) {
          const poolEnv = $pool.get(route);
          if (poolEnv && poolEnv.type === 'BUNDLE' && poolEnv.data.parameters.has(k)) {
            poolVal = poolEnv.data.parameters.get(k).value;
          }
        }
        return {
          name: k, 
          value: poolVal,
          setting: plugin.paramSettings.get(settingId)
        };
      });
      return { type: 'BUNDLE', id: input, name: sourceOutput, params };
    }
    return null;
  }).filter(Boolean) : [];

</script>

<PluginNode {data}>
  {#if plugin && plugin.name === 'VTS Output' && connectedData.length > 0}
    <div class="node-settings vts-output-panel nodrag">
      <div class="vts-grid-row vts-header-row">
        <span class="col-name">Param</span>
        <span class="col-val">Val</span>
        <span class="col-min">Min</span>
        <span class="col-def">Def</span>
        <span class="col-max">Max</span>
        <span class="col-exp">Exp</span>
      </div>
      {#each connectedData.filter(i => i !== null) as item (item.id)}
        {#if item.type === 'SINGLE'}
          <div class="vts-grid-row vts-param-row">
            <span class="vts-param-name" title={item.name}>{item.name}</span>
            <span class="vts-param-val">{Number(item.value).toFixed(2)}</span>
            <input type="number" class="vts-num-input" bind:value={item.setting.min} title="Min" />
            <input type="number" class="vts-num-input" bind:value={item.setting.def} title="Default" />
            <input type="number" class="vts-num-input" bind:value={item.setting.max} title="Max" />
            <div class="vts-check-container"><input type="checkbox" bind:checked={item.setting.expose} title="Expose to VTS" /></div>
          </div>
        {:else if item.type === 'BUNDLE'}
          <div class="vts-bundle-container">
            <div class="vts-bundle-title">{item.name}</div>
            <div class="vts-bundle-children">
              {#each item.params as p (p.name)}
                <div class="vts-grid-row vts-param-row vts-child-row">
                  <span class="vts-param-name" title={p.name}>{p.name}</span>
                  <span class="vts-param-val">{Number(p.value).toFixed(2)}</span>
                  <input type="number" class="vts-num-input" bind:value={p.setting.min} title="Min" />
                  <input type="number" class="vts-num-input" bind:value={p.setting.def} title="Default" />
                  <input type="number" class="vts-num-input" bind:value={p.setting.max} title="Max" />
                  <div class="vts-check-container"><input type="checkbox" bind:checked={p.setting.expose} title="Expose to VTS" /></div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</PluginNode>