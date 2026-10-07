import { MeshNode, MeshPacket } from '../types/disaster';
import { INITIAL_MESH_NODES } from '../data/seedData';

type PacketHandler = (packet: MeshPacket) => void;

class MeshProtocolEngine {
  private nodes: MeshNode[] = [...INITIAL_MESH_NODES];
  private packetStore: Map<string, MeshPacket> = new Map();
  private outboxQueue: MeshPacket[] = [];
  private listeners: Set<PacketHandler> = new Set();
  private isSimulatingMesh = true;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedOutbox = localStorage.getItem('guardian_mesh_outbox');
      if (storedOutbox) {
        this.outboxQueue = JSON.parse(storedOutbox);
      }
      const storedPackets = localStorage.getItem('guardian_mesh_packets');
      if (storedPackets) {
        const parsed = JSON.parse(storedPackets) as MeshPacket[];
        parsed.forEach(p => this.packetStore.set(p.id, p));
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('guardian_mesh_outbox', JSON.stringify(this.outboxQueue));
      const recent = Array.from(this.packetStore.values()).slice(-50);
      localStorage.setItem('guardian_mesh_packets', JSON.stringify(recent));
    } catch {
      // Ignore
    }
  }

  public getNodes(): MeshNode[] {
    return [...this.nodes];
  }

  public getPackets(): MeshPacket[] {
    return Array.from(this.packetStore.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getOutboxCount(): number {
    return this.outboxQueue.length;
  }

  public subscribe(handler: PacketHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /**
   * Broadcasts a new packet originating from this device into the simulated BLE / Wi-Fi Direct mesh.
   */
  public broadcastPacket(
    type: MeshPacket['type'],
    payload: any,
    senderId: string = 'Local-Device-Node'
  ): MeshPacket {
    const packetId = 'PKT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const packet: MeshPacket = {
      id: packetId,
      type,
      senderId,
      receiverId: 'BROADCAST',
      timestamp: new Date().toISOString(),
      ttl: 6,
      hopCount: 1,
      path: [senderId],
      payload
    };

    // Store in local ledger
    this.packetStore.set(packet.id, packet);
    this.saveToStorage();

    // Dispatch locally immediately
    this.dispatchToListeners(packet);

    // Simulate multi-hop propagation over neighboring mesh relays
    this.simulateMeshRelayHops(packet);

    return packet;
  }

  /**
   * Simulates multi-hop Store-and-Forward propagation through intermediate BLE/RF relays.
   */
  private simulateMeshRelayHops(packet: MeshPacket) {
    if (!this.isSimulatingMesh) return;

    // Pick 1-3 relay nodes based on simulated proximity
    const relayCandidates = this.nodes.filter(n => n.id !== packet.senderId && n.active);
    if (relayCandidates.length === 0) return;

    const hopsToSimulate = Math.min(3, relayCandidates.length);
    let currentPacket = { ...packet };

    for (let i = 0; i < hopsToSimulate; i++) {
      const delay = (i + 1) * 900; // 900ms per hop
      setTimeout(() => {
        const nextRelay = relayCandidates[i % relayCandidates.length];
        if (!currentPacket.path.includes(nextRelay.name)) {
          currentPacket = {
            ...currentPacket,
            hopCount: currentPacket.hopCount + 1,
            ttl: Math.max(0, currentPacket.ttl - 1),
            path: [...currentPacket.path, nextRelay.name]
          };
          this.packetStore.set(currentPacket.id, currentPacket);
          this.saveToStorage();
          this.dispatchToListeners(currentPacket);
        }
      }, delay);
    }
  }

  private dispatchToListeners(packet: MeshPacket) {
    this.listeners.forEach(handler => {
      try {
        handler(packet);
      } catch (err) {
        console.error('Mesh packet handler error:', err);
      }
    });
  }

  public addNode(node: MeshNode) {
    this.nodes.push(node);
  }

  public flushOutbox() {
    const queued = [...this.outboxQueue];
    this.outboxQueue = [];
    this.saveToStorage();
    queued.forEach(p => {
      this.broadcastPacket(p.type, p.payload, p.senderId);
    });
  }
}

export const meshEngine = new MeshProtocolEngine();
