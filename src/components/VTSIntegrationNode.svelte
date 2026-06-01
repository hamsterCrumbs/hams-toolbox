<script lang="ts">
  import IntegrationNode from './IntegrationNode.svelte';

  export let data: { label: string; outputs: string[]; id: string; engine: any };

  $: integration = data.engine.getIntegrations().find((i: any) => i.id === data.id);
</script>

<IntegrationNode {data}>
  {#if integration && integration.iphoneIp !== undefined}
    <div class="node-settings nodrag">
      <input type="text" class="integration-input nodrag" bind:value={integration.iphoneIp} placeholder="iPhone IP" title="iPhone IP" />
      <input type="number" class="integration-input nodrag" bind:value={integration.vtsPort} placeholder="Port" title="Port" />
      {#if integration.reconnect}
        <button class="integration-btn nodrag" onclick={() => integration.reconnect()}>Reconnect</button>
      {/if}
    </div>
  {/if}
</IntegrationNode>