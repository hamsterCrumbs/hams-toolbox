<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';

  // Svelte Flow passes node properties via the 'data' prop
  export let data: {
    label: string;
    outputs: string[];
  };
</script>

<div class="integration-node">
  <div class="node-header">
    <span class="badge">Source</span>
    <h3>{data.label}</h3>
  </div>

  <div class="ports-container">
    {#each data.outputs as output}
      <div class="port-row output-row">
        <span class="port-label">{output}</span>
        <Handle
          type="source"
          position={Position.Right}
          id={output}
          style="top: auto; transform: none; right: -8px;"
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .integration-node {
    background: #1e293b;
    border: 2px solid #38bdf8;
    border-radius: 8px;
    color: #f8fafc;
    min-width: 180px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }
  .node-header {
    background: #0f172a;
    padding: 0.5rem;
    border-bottom: 1px solid #334155;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }
  .badge {
    font-size: 0.65rem;
    background: #0284c7;
    color: #e0f2fe;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: bold;
  }
  h3 {
    margin: 0.2rem 0 0 0;
    font-size: 0.9rem;
  }
  .ports-container {
    padding: 0.5rem;
  }
  .port-row {
    position: relative;
    display: flex;
    align-items: center;
    height: 28px;
    font-family: monospace;
    font-size: 0.75rem;
  }
  .output-row {
    justify-content: flex-end;
    color: #38bdf8;
  }
  .port-label {
    margin-right: 4px;
  }
</style>