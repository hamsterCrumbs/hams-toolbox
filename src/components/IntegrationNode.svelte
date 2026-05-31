<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  
  export let data: { label: string; outputs: string[] };
</script>

<div class="node">
  <div class="title">{data.label}</div>
  
  <div class="ports">
    {#each data.outputs as output}
      <div class="port-row">
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
    border: 1px solid #3b82f6;
    border-radius: 8px;
    min-width: 150px;
    color: #f8fafc;
  }
  .title {
    background-color: #3b82f6;
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
    text-align: right;
  }
  .port-label {
    font-size: 12px;
    color: #cbd5e1;
  }
  /* :global() is required to style components imported from external libraries in Svelte */
  :global(.handle) {
    width: 10px;
    height: 10px;
    background-color: #60a5fa;
    border: 2px solid #1e293b;
  }
</style>