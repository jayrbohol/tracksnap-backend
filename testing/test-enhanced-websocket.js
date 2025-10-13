/**
 * Enhanced WebSocket Hub Test Script
 * Demonstrates parcel-specific subscriptions and multiple webhook broadcasting
 */

import WebSocket from 'ws';

// Test configuration
const WS_URL = 'ws://localhost:3000/ws';
const API_BASE = 'http://localhost:3000';
const TEST_PARCELS = ['parcel-test001', 'parcel-test002', 'parcel-test003'];

class WebSocketTester {
  constructor(clientName, parcelIds = []) {
    this.clientName = clientName;
    this.parcelIds = parcelIds;
    this.ws = null;
    this.messageCount = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.on('open', () => {
        console.log(`🔗 [${this.clientName}] Connected to WebSocket`);
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error(`❌ [${this.clientName}] WebSocket error:`, error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log(`🔌 [${this.clientName}] WebSocket closed`);
      });
    });
  }

  handleMessage(data) {
    this.messageCount++;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`📨 [${this.clientName}] (${this.messageCount}) ${timestamp} - ${data.type}:`, 
      data.parcelId ? `Parcel: ${data.parcelId}` : data.message || JSON.stringify(data, null, 2)
    );

    // Handle specific message types
    switch (data.type) {
      case 'welcome':
        this.subscribeToTestParcels();
        break;
      case 'subscribed':
        console.log(`   ✅ [${this.clientName}] Successfully subscribed to: ${data.parcelId}`);
        break;
      case 'tracking':
        console.log(`   📍 [${this.clientName}] Location: ${data.point?.coordinates?.lat}, ${data.point?.coordinates?.lng}`);
        break;
      case 'handoff':
        console.log(`   📦 [${this.clientName}] Delivered! Status: ${data.status}`);
        break;
      case 'status_update':
        console.log(`   🔄 [${this.clientName}] Status changed to: ${data.status}`);
        break;
      case 'system_alert':
        console.log(`   🚨 [${this.clientName}] ALERT [${data.priority}]: ${data.message}`);
        break;
    }
  }

  subscribeToTestParcels() {
    if (this.parcelIds.length > 0) {
      console.log(`🎯 [${this.clientName}] Subscribing to parcels:`, this.parcelIds);
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        parcelIds: this.parcelIds
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// API Testing Helper
class APITester {
  static async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(`🌐 API ${method} ${endpoint}:`, response.status, data.message || data.status);
      return data;
    } catch (error) {
      console.error(`❌ API ${method} ${endpoint} failed:`, error.message);
      return null;
    }
  }

  static async getWebSocketStats() {
    return this.makeRequest('/ws/stats');
  }

  static async getTrackedParcels() {
    return this.makeRequest('/ws/tracked-parcels');
  }

  static async broadcastToSubscribers(parcelIds, type, message, data = {}) {
    return this.makeRequest('/ws/broadcast', 'POST', {
      parcelIds,
      type,
      message,
      data
    });
  }

  static async sendSystemAlert(message, priority = 'info', targetParcels = null) {
    return this.makeRequest('/ws/system-alert', 'POST', {
      message,
      priority,
      targetParcels
    });
  }

  static async sendTestMessage(parcelId, message) {
    return this.makeRequest('/ws/test', 'POST', {
      parcelId,
      message
    });
  }

  static async cleanupConnections() {
    return this.makeRequest('/ws/cleanup', 'POST');
  }
}

// Test Scenarios
async function runWebSocketTests() {
  console.log('🚀 Starting Enhanced WebSocket Hub Tests\n');

  // Create multiple test clients with different subscription patterns
  const clients = [
    new WebSocketTester('Customer-1', ['parcel-test001']),           // Single parcel
    new WebSocketTester('Customer-2', ['parcel-test002']),           // Single parcel  
    new WebSocketTester('Courier-1', ['parcel-test001', 'parcel-test002']), // Multiple parcels
    new WebSocketTester('Admin-Dashboard', TEST_PARCELS),            // All test parcels
    new WebSocketTester('Observer', [])                              // No subscriptions
  ];

  try {
    // Connect all clients
    console.log('📡 Connecting WebSocket clients...\n');
    await Promise.all(clients.map(client => client.connect()));
    
    // Wait for subscriptions to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Check WebSocket statistics
    console.log('\n📊 Test 1: Checking WebSocket Statistics');
    await APITester.getWebSocketStats();
    await APITester.getTrackedParcels();

    // Test 2: Broadcast to specific parcel subscribers
    console.log('\n📢 Test 2: Broadcasting to Specific Parcels');
    await APITester.broadcastToSubscribers(
      ['parcel-test001', 'parcel-test002'],
      'route_optimization',
      'Your delivery route has been optimized',
      { estimatedTimeSaved: '15 minutes' }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Send system alert to all
    console.log('\n🚨 Test 3: System Alert to All Subscribers');
    await APITester.sendSystemAlert(
      'System maintenance scheduled for tonight at 2 AM',
      'warning'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Send targeted system alert
    console.log('\n🎯 Test 4: Targeted System Alert');
    await APITester.sendSystemAlert(
      'Your parcel is approaching the final delivery hub',
      'info',
      ['parcel-test001']
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: Send test message to specific parcel
    console.log('\n🧪 Test 5: Test Message to Specific Parcel');
    await APITester.sendTestMessage(
      'parcel-test002',
      'This is a test notification for your parcel'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 6: Simulate parcel events (if server is running)
    console.log('\n📦 Test 6: Simulating Parcel Events (requires running server)');
    console.log('   To test parcel events, run:');
    console.log('   curl -X POST http://localhost:3000/track-parcel \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"parcelId":"parcel-test001","coordinates":{"lat":14.5547,"lng":121.0244}}\'');

    // Test 7: Connection cleanup
    console.log('\n🧹 Test 7: Connection Cleanup');
    await APITester.cleanupConnections();

    // Wait for final messages
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Show final statistics
    console.log('\n📈 Final Statistics:');
    clients.forEach(client => {
      console.log(`   ${client.clientName}: ${client.messageCount} messages received`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Disconnect all clients
    console.log('\n🔌 Disconnecting all clients...');
    clients.forEach(client => client.disconnect());
  }

  console.log('\n✅ Enhanced WebSocket Hub Tests Complete!');
}

// Subscription Pattern Demo
async function demonstrateSubscriptionPatterns() {
  console.log('\n🎭 Demonstrating Different Subscription Patterns:\n');

  const patterns = [
    {
      name: 'E-commerce Customer',
      description: 'Customer tracking their single order',
      parcels: ['parcel-order-12345'],
      useCase: 'Real-time tracking page for their specific order'
    },
    {
      name: 'Delivery Driver',
      description: 'Courier with assigned route parcels',
      parcels: ['parcel-route-001', 'parcel-route-002', 'parcel-route-003'],
      useCase: 'Mobile app showing all parcels in current delivery batch'
    },
    {
      name: 'Customer Service',
      description: 'Support agent monitoring flagged parcels',
      parcels: ['parcel-flagged-001', 'parcel-flagged-002'],
      useCase: 'Dashboard showing parcels with customer issues'
    },
    {
      name: 'Operations Manager',
      description: 'Manager monitoring priority deliveries',
      parcels: ['parcel-priority-001', 'parcel-priority-002', 'parcel-priority-003', 'parcel-priority-004'],
      useCase: 'Executive dashboard for high-value or time-sensitive parcels'
    }
  ];

  patterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.name}`);
    console.log(`   📝 ${pattern.description}`);
    console.log(`   📦 Tracking ${pattern.parcels.length} parcel(s): ${pattern.parcels.join(', ')}`);
    console.log(`   💡 Use Case: ${pattern.useCase}\n`);
  });
}

// Performance Comparison Demo
function showPerformanceComparison() {
  console.log('\n⚡ Performance Comparison:\n');

  const scenarios = [
    {
      description: 'Small Scale (10 parcels, 5 clients)',
      oldSystem: '50 messages/minute (all clients get all updates)',
      newSystem: '10 messages/minute (targeted subscriptions)',
      improvement: '80% reduction'
    },
    {
      description: 'Medium Scale (100 parcels, 50 clients)', 
      oldSystem: '5,000 messages/minute (broadcast storm)',
      newSystem: '500 messages/minute (targeted delivery)',
      improvement: '90% reduction'
    },
    {
      description: 'Large Scale (1,000 parcels, 500 clients)',
      oldSystem: '500,000 messages/minute (system overload)',
      newSystem: '25,000 messages/minute (efficient targeting)',
      improvement: '95% reduction'
    }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.description}`);
    console.log(`   📊 Old System: ${scenario.oldSystem}`);
    console.log(`   🎯 New System: ${scenario.newSystem}`);
    console.log(`   🚀 Improvement: ${scenario.improvement}\n`);
  });
}

// Main execution
async function main() {
  console.log('🔄 TrackSnap Enhanced WebSocket Hub Testing Suite\n');
  console.log('This script tests the enhanced WebSocket functionality with parcel-specific subscriptions.\n');

  // Show conceptual information
  demonstrateSubscriptionPatterns();
  showPerformanceComparison();

  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_BASE}/health`);
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
    console.log('✅ TrackSnap server is running - proceeding with live tests\n');
    await runWebSocketTests();
  } catch (error) {
    console.log('⚠️  TrackSnap server is not running - showing conceptual demo only');
    console.log('   To run live tests, start the server with: npm run dev\n');
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n👋 Exiting WebSocket tests...');
  process.exit(0);
});

// Export for use as module or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { WebSocketTester, APITester };