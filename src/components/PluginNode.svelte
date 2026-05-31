<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  
  export let data: { label: string; inputs: string[]; outputs: string[] };
</script>

<div class="node">
  <div class="title">{data.label}</div>
  
  <div class="ports">
    <!-- Inputs on the Left -->
    {#each data.inputs as input}
      <div class="port-row input-row">
        <Handle 
          type="target" 
          position={Position.Left} 
          id={input} 
          class="handle" 
        />
        <span class="port-label">{input}</span>
      </div>
    {/each}

    <!-- Outputs on the Right -->
    {#each data.outputs as output}
      <div class="port-row output-row">
        <span class="port-label">{output}</span>
        <Handle 
          type="source" 
          position={Position.Right} 
          id={output} 
          class="handle" 
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .node {
    background-color: #1e293b;
    border: 1px solid #10b981;
    border-radius: 8px;
    min-width: 150px;
    color: #f8fafc;
  }
  .title {
    background-color: #10b981;
    padding: 8px;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
    font-weight: 600;
    text-align: center;
    font-size: 14px;
  }
  .ports {
    padding: 10px 0;
  }
  .port-row {
    position: relative;
    padding: 4px 12px;
  }
  .input-row {
    text-align: left;
  }
  .output-row {
    text-align: right;
  }
  .port-label {
    font-size: 12px;
    color: #cbd5e1;
  }
  :global(.handle) {
    width: 10px;
    height: 10px;
    background-color: #34d399;
    border: 2px solid #1e293b;
  }
</style>