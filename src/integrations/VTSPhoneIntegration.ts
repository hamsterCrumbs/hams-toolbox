import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { IIntegration, DataEnvelope } from '../core/types';
import { createHeadJointsBundle, createEyeJointsBundle, createARKitBundle } from '../bundles/vtsBundles';

const ARKIT_BLENDSHAPES = [
  'EyeBlinkLeft', 'EyeLookDownLeft', 'EyeLookInLeft', 'EyeLookOutLeft', 'EyeLookUpLeft', 'EyeSquintLeft', 'EyeWideLeft',
  'EyeBlinkRight', 'EyeLookDownRight', 'EyeLookInRight', 'EyeLookOutRight', 'EyeLookUpRight', 'EyeSquintRight', 'EyeWideRight',
  'JawForward', 'JawLeft', 'JawRight', 'JawOpen',
  'MouthClose', 'MouthFunnel', 'MouthPucker', 'MouthLeft', 'MouthRight', 'MouthSmileLeft', 'MouthSmileRight', 'MouthFrownLeft', 'MouthFrownRight', 'MouthDimpleLeft', 'MouthDimpleRight', 'MouthStretchLeft', 'MouthStretchRight', 'MouthRollLower', 'MouthRollUpper', 'MouthShrugLower', 'MouthShrugUpper', 'MouthPressLeft', 'MouthPressRight', 'MouthLowerDownLeft', 'MouthLowerDownRight', 'MouthUpperUpLeft', 'MouthUpperUpRight',
  'BrowDownLeft', 'BrowDownRight', 'BrowInnerUp', 'BrowOuterUpLeft', 'BrowOuterUpRight',
  'CheekPuff', 'CheekSquintLeft', 'CheekSquintRight',
  'NoseSneerLeft', 'NoseSneerRight',
  'TongueOut'
];

export class VTSPhoneIntegration implements IIntegration {
  id = 'int_vts_phone_' + Math.random().toString(36).substring(2, 9);
  name = 'VTS Phone Integration';
  isConnected = false;
  
  private outputs = new Map<string, DataEnvelope>();
  public iphoneIp: string;
  public vtsPort: number;
  private listenPort: number;
  private latestData: any = null;
  private unlistenData: UnlistenFn | null = null;

  constructor(iphoneIp: string = '192.168.254.102', vtsPort: number = 21412, listenPort: number = 39540) {
    this.iphoneIp = iphoneIp;
    this.vtsPort = vtsPort;
    this.listenPort = listenPort;

    // Pre-initialize standard outputs so they appear on the canvas immediately
    const initOutput = (key: string) => {
      this.outputs.set(key, { type: 'SINGLE', data: { id: key, value: 0 } });
    };

    initOutput('Timestamp');
    initOutput('Hotkey');
    initOutput('FaceFound');

    this.outputs.set('HeadJoints', { type: 'BUNDLE', data: createHeadJointsBundle() });
    this.outputs.set('EyeJoints', { type: 'BUNDLE', data: createEyeJointsBundle() });
    this.outputs.set('ARKit', { type: 'BUNDLE', data: createARKitBundle() });
  }
  
  async connect() {
    return new Promise<boolean>(async (resolve) => {
      try {
        // 1. Listen for the VTS_DATA event emitted by our Rust backend (prevent duplicate listeners)
        if (!this.unlistenData) {
          this.unlistenData = await listen<string>('VTS_DATA', (event) => {
            try {
              const parsed = JSON.parse(event.payload);
              this.latestData = parsed;
            } catch (e) {
              // ignore malformed JSON
            }
          });
        }

        // 2. Instruct Rust to start (or restart) the background UDP listener thread!
        await invoke('start_udp_listener', {
          iphoneIp: this.iphoneIp,
          vtsPort: this.vtsPort,
          listenPort: this.listenPort
        });

        this.isConnected = true;
        resolve(true);
      } catch (err) {
        console.warn('Failed to start Tauri UDP listener:', err);
        resolve(false);
      }
    });
  }

  async disconnect() {
    this.isConnected = false;
    if (this.unlistenData) {
      this.unlistenData();
      this.unlistenData = null;
    }
  }

  // New method to easily trigger a fresh rust listener without destroying the node
  reconnect = async () => {
    console.log("Reconnecting VTS with IP:", this.iphoneIp, "Port:", this.vtsPort);
    return await this.connect();
  }

  poll() {
    if (!this.latestData) return;

    const d = this.latestData;
    const setOut = (key: string, val: number) => {
      this.outputs.set(key, { type: 'SINGLE', data: { id: key, value: val } });
    };

    if (d.Timestamp !== undefined) setOut('Timestamp', d.Timestamp);
    if (d.Hotkey !== undefined) setOut('Hotkey', d.Hotkey);
    setOut('FaceFound', d.FaceFound ? 1 : 0);
    
    // Helper to safely update parameters inside a bundle
    const updateBundle = (bundleId: string, paramId: string, value: number) => {
      const env = this.outputs.get(bundleId);
      if (env && env.type === 'BUNDLE') {
        const param = env.data.parameters.get(paramId);
        if (param) param.value = value;
      }
    };


    if (d.Position) {
      updateBundle('HeadJoints', 'Position.x', d.Position.x);
      updateBundle('HeadJoints', 'Position.y', d.Position.y);
      updateBundle('HeadJoints', 'Position.z', d.Position.z);
    }

    if (d.Rotation) {
      updateBundle('HeadJoints', 'Rotation.x', d.Rotation.x);
      updateBundle('HeadJoints', 'Rotation.y', d.Rotation.y);
      updateBundle('HeadJoints', 'Rotation.z', d.Rotation.z);
    }

    if (d.EyeLeft) {
      updateBundle('EyeJoints', 'EyeLeft.x', d.EyeLeft.x);
      updateBundle('EyeJoints', 'EyeLeft.y', d.EyeLeft.y);
      updateBundle('EyeJoints', 'EyeLeft.z', d.EyeLeft.z);
    }

    if (d.EyeRight) {
      updateBundle('EyeJoints', 'EyeRight.x', d.EyeRight.x);
      updateBundle('EyeJoints', 'EyeRight.y', d.EyeRight.y);
      updateBundle('EyeJoints', 'EyeRight.z', d.EyeRight.z);
    }

    // Map ARKit Blendshapes exactly as they appear in the JSON
    if (d.BlendShapes && Array.isArray(d.BlendShapes)) {
      for (const shape of d.BlendShapes) {
        updateBundle('ARKit', shape.k, shape.v);
      }
    }
  }

  getOutputs() {
    return this.outputs;
  }
}