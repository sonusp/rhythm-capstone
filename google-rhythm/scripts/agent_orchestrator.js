import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../.env.local' });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

/**
 * AI Agents: Intensive Vibe Coding Capstone
 * Multi-Agent Orchestration System (The Swarm)
 * 
 * This script demonstrates a custom Agent Development Kit (ADK) pattern.
 * It uses a Planner -> Architect -> Builder pipeline to process complex health data.
 */

async function runAgentSwarm(userRequest) {
    console.log(`🚀 Starting Swarm Orchestration for Request: "${userRequest}"\n`);
    
    // ---------------------------------------------------------
    // 1. THE PLANNER AGENT (Orchestrator)
    // ---------------------------------------------------------
    console.log('🧠 [Planner Agent] Analyzing request and delegating tasks...');
    const plannerModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: "You are the Swarm Orchestrator. Break the user's request down into exactly two steps: 1. Architecture Spec (for the Architect). 2. Implementation Logic (for the Builder). Return ONLY a JSON object."});
    
    const plannerPrompt = `Break this down: ${userRequest}`;
    const plannerResponse = await plannerModel.generateContent(plannerPrompt);
    const plan = plannerResponse.response.text();
    console.log(`📋 Plan Generated:\n${plan}\n`);

    // ---------------------------------------------------------
    // 2. THE ARCHITECT AGENT (Spec Driven Development)
    // ---------------------------------------------------------
    console.log('📐 [Architect Agent] Drafting technical specification...');
    const architectModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: "You are the System Architect. Output a strict JSON schema or structural design for the requested health feature. Do not write implementation code."});
    
    const architectPrompt = `Based on the plan, generate the architecture spec: ${plan}`;
    const architectResponse = await architectModel.generateContent(architectPrompt);
    const architectureSpec = architectResponse.response.text();
    console.log(`🏗️ Architecture Spec:\n${architectureSpec}\n`);

    // ---------------------------------------------------------
    // 3. THE BUILDER AGENT (Implementation)
    // ---------------------------------------------------------
    console.log('🔨 [Builder Agent] Implementing code based on spec...');
    const builderModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: "You are the Builder Agent. Write the JavaScript implementation code based strictly on the provided Architecture Spec. Output only code."});
    
    const builderPrompt = `Implement this spec: ${architectureSpec}`;
    const builderResponse = await builderModel.generateContent(builderPrompt);
    const finalCode = builderResponse.response.text();
    console.log(`✅ Final Implementation Code:\n${finalCode}\n`);

    console.log('🎉 Swarm Execution Complete.');
}

// Execute the Swarm
const request = "Create a database schema and helper function to track PCOS specific symptoms like insulin resistance and hirsutism.";
runAgentSwarm(request).catch(console.error);
