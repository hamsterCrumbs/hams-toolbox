<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';

  export let data: {
    label: string;
    inputs: string[];
    outputs: string[];
  };
</script>

<div class="plugin-node">
  <div class="node-header">
    <span class="badge">Processor</span>
    <h3>{data.label}</h3>
  </div>

  <div class="node-body">
    <div class="ports-column inputs-column">
      {#each data.inputs as input}
        <div class="port-row input-row">
          <Handle
            type="target"
            position={Position.Left}
            id={input}
            style="top: auto; transform: none; left: -8px;"
          />
          <span class="port-label">{input}</span>
        </div>
      {/each}
    </div>

    <div class="ports-column outputs-column">
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
</div>

<style>
  .plugin-node {
    background: #1e293b;
    border: 2px solid #a855f7;
    border-radius: 8px;
    color: #f8fafc;
    min-width: 220px;
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
    background: #7e22ce;
    color: #f3e8ff;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: bold;
  }
  h3 {
    margin: 0.2rem 0 0 0;
    font-size: 0.9rem;
  }
  .node-body {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    gap: 1rem;
  }
  .ports-column {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .port-row {
    position: relative;
    display: flex;
    align-items: center;
    height: 28px;
    font-family: monospace;
    font-size: 0.75rem;
  }
  .input-row {
    justify-content: flex-start;
    color: #e2e8f0;
  }
  .output-row {
    justify-content: flex-end;
    color: #c084fc;
  }
  .input-row .port-label {
    margin-left: 4px;
  }
  .output-row .port-label {
    margin-right: 4px;
  }
</style>