# 🚀 AI Weex Trading: Real-Time Analysis & Voice Synthesis

An experimental **Artificial Intelligence Trading Assistant**. This system monitors the cryptocurrency market in real-time, processes technical indicators using **Gemini AI**, and narrates strategic insights using high-fidelity professional voices from **ElevenLabs**.

## 🎯 Project Objective
The goal is to transform complex data from exchanges (such as WEEX) into actionable and auditory information. The system is designed to detect **"Accumulation Wells"** (Spot strategy) and **breakout signals** (Futures strategy) through automated intelligence.

## 🛠️ Tech Stack

### **Core Technologies**
* **Frontend:** React.js, Recharts (Data Visualization), CSS-in-JS.
* **Backend:** Node.js, Express.
* **Generative AI:** Google Gemini 1.5 Flash (Trend Analysis).
* **Professional Voice:** ElevenLabs API (High-fidelity Text-to-Speech).
* **Data Source:** WEEX API (Market data for both Contracts and Spot).

### **Key Features**
* **Narrated Analysis:** Strategic reports you can listen to instead of just reading.
* **Responsive Dashboard:** Optimized for desktop browsers and mobile devices.
* **Passive Monitor:** Logic implemented to detect unusual volume movements without user intervention.
* **Multi-Crypto Support:** Integrated selectors for the top 20 cryptocurrencies.

## 📦 Repository Structure
* `/backend/server.js`: Express server acting as a secure bridge to bypass CORS issues and manage AI logic.
* `/frontend/src/components/CryptoAnalysis.js`: Dynamic UI featuring real-time charts and strategy selectors.

## ⚠️ Security Requirements (Mandatory)
This project uses environment variables to handle sensitive information. **Never upload your `.env` file to GitHub.**

1. Clone the repository.
2. Create a `.env` file in the backend folder.
3. Add your credentials:
   ```env
   GEMINI_API_KEY=your_key_here
   ELEVENLABS_API_KEY=your_key_here
   PORT=3000

## Installation and Usage
**Frontend Setup**
cd backend
npm install
# Create .env file and add your keys
npm run dev

**Backend Setup**
cd crypto-web
npm install
npm start



   
