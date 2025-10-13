/**
 * Simple WebSocket Test Script
 * Basic test for the enhanced WebSocket hub features
 */

import WebSocket from 'ws';

console.log('🧪 Starting WebSocket Hub Test');

// Test configuration
const WS_URL = 'ws://localhost:3000/ws';
const TEST_TIMEOUT = 10000; // 10 seconds

let testResults = {
  connection: false,
  subscription: false,
  messages: []
};

function runTest() {
  return new Promise((resolve, reject) => {
    console.log('🔗 Connecting to WebSocket...');
    const ws = new WebSocket(WS_URL);
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('❌ Test timed out');
      ws.close();
      reject(new Error('Test timeout'));
    }, TEST_TIMEOUT);

    ws.on('open', () => {
      console.log('✅ Connected to WebSocket');
      testResults.connection = true;
      
      // Test subscription to a parcel
      console.log('📡 Testing parcel subscription...');
      ws.send(JSON.stringify({
        type: 'subscribe',
        parcelId: 'test-parcel-123'
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received:', message.type, message.message || message.parcelId || '');
        testResults.messages.push(message);
        
        if (message.type === 'welcome') {
          console.log('👋 Welcome message received');
        }
        
        if (message.type === 'subscribed') {
          console.log('✅ Subscription confirmed for:', message.parcelId);
          testResults.subscription = true;
          
          // Test listing subscriptions
          setTimeout(() => {
            console.log('📋 Testing subscription list...');
            ws.send(JSON.stringify({
              type: 'list_subscriptions'
            }));
          }, 1000);
        }
        
        if (message.type === 'subscriptions') {
          console.log('📋 Current subscriptions:', message.parcelIds);
          
          // Test unsubscribe
          setTimeout(() => {
            console.log('🔌 Testing unsubscribe...');
            ws.send(JSON.stringify({
              type: 'unsubscribe',
              parcelId: 'test-parcel-123'
            }));
          }, 1000);
        }
        
        if (message.type === 'unsubscribed') {
          console.log('✅ Unsubscription confirmed for:', message.parcelId);
          
          // Complete the test
          setTimeout(() => {
            clearTimeout(timeout);
            ws.close();
            resolve(testResults);
          }, 1000);
        }
        
      } catch (error) {
        console.error('❌ Error parsing message:', error.message);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      reject(error);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
  });
}

// Run the test
async function main() {
  try {
    const results = await runTest();
    
    console.log('\n📊 Test Results:');
    console.log('  Connection:', results.connection ? '✅ PASS' : '❌ FAIL');
    console.log('  Subscription:', results.subscription ? '✅ PASS' : '❌ FAIL');
    console.log('  Messages received:', results.messages.length);
    
    if (results.connection && results.subscription) {
      console.log('\n🎉 WebSocket Hub test PASSED!');
      console.log('\n🔄 The enhanced WebSocket hub is working correctly with:');
      console.log('  ✅ Parcel-specific subscriptions');
      console.log('  ✅ Subscription management');
      console.log('  ✅ Real-time messaging');
    } else {
      console.log('\n❌ WebSocket Hub test FAILED!');
      console.log('Please check the server is properly configured.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Make sure the TrackSnap server is running: npm run dev');
    console.log('  2. Check if port 3000 is available');
    console.log('  3. Verify WebSocket support is enabled');
    process.exit(1);
  }
}

main();