<script lang="ts">
  import IntegrationNode from './IntegrationNode.svelte';

  export let data: { label: string; outputs: string[]; id: string; engine: any };

  $: integration = data.engine.getIntegrations().find((i: any) => i.id === data.id);
</script>

<IntegrationNode {data}>
  {#if integration && integration.iphoneIp !== undefined}
    <div class="settings">
      <input type="text" class="nodrag" bind:value={integration.iphoneIp} placeholder="iPhone IP" title="iPhone IP" />
      <input type="number" class="nodrag" bind:value={integration.vtsPort} placeholder="Port" title="Port" />
      {#if integration.reconnect}
        <button class="reconnect-btn nodrag" onclick={() => integration.reconnect()}>Reconnect</button>
      {/if}
    </div>
  {/if}
</IntegrationNode>

<style>
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
  .reconnect-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 2px;
  }
  .reconnect-btn:hover {
    background: #2563eb;
  }
</style>