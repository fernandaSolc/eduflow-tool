#!/usr/bin/env node

/**
 * Script para testar os health checks dos serviços
 * Execute com: node test-health-checks.js
 */

const BASE_URL = 'http://localhost:9002';

async function testHealthCheck(endpoint, serviceName) {
  try {
    console.log(`\n🔍 Testando ${serviceName}...`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${serviceName}: OK`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      
      if (data.services) {
        console.log(`   Serviços:`, data.services);
      }
    } else {
      console.log(`❌ ${serviceName}: ERRO`);
      console.log(`   Status HTTP: ${response.status}`);
      console.log(`   Resposta:`, data);
    }
  } catch (error) {
    console.log(`❌ ${serviceName}: ERRO DE CONEXÃO`);
    console.log(`   Erro: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de health check...');
  console.log(`📡 Base URL: ${BASE_URL}`);
  
  // Teste AI Service
  await testHealthCheck('/api/health/ai', 'AI Service');
  
  // Teste Backend Service
  await testHealthCheck('/api/health/backend', 'Backend Service');
  
  console.log('\n✨ Testes concluídos!');
}

// Executar testes
runTests().catch(console.error);
