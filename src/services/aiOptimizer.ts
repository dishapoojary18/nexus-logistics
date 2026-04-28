import { GoogleGenAI, Type } from "@google/genai";
import { Shipment, Disruption, OptimizationSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getOptimizationSuggestion(
  shipment: Shipment,
  disruption: Disruption
): Promise<OptimizationSuggestion | null> {
  try {
    const prompt = `
      Shipment ${shipment.id} (${shipment.name}) is traveling from ${shipment.origin} to ${shipment.destination}.
      Current Status: ${shipment.status}. Priority: ${shipment.priority}.
      Current Position: Lat ${shipment.currentPos.lat}, Lng ${shipment.currentPos.lng}.
      
      A disruption has occurred:
      ID: ${disruption.id}
      Type: ${disruption.type}
      Severity: ${disruption.severity}
      Location: Lat ${disruption.location.lat}, Lng ${disruption.location.lng}
      Description: ${disruption.description}
      
      Analyze the situation and suggest an optimized reroute or adjustment.
      Respond with a JSON object containing technical recommendations.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reason: { type: Type.STRING, description: "Detailed analysis of why rerouting is needed." },
            newEta: { type: Type.STRING, description: "New estimated arrival time (ISO string or duration string)." },
            newRouteSummary: { type: Type.STRING, description: "Summary of the alternative route recommended." },
          },
          required: ["reason", "newEta", "newRouteSummary"]
        }
      }
    });

    const result = JSON.parse(response.text);

    return {
      id: `OPT-${Math.floor(Math.random() * 10000)}`,
      shipmentId: shipment.id,
      originalEta: shipment.eta,
      newEta: result.newEta,
      reason: result.reason,
      newRouteSummary: result.newRouteSummary
    };
  } catch (error) {
    console.error("AI Optimization Error:", error);
    return null;
  }
}

export async function getETAPrediction(
  shipment: Shipment,
  nearbyDisruptions: Disruption[]
): Promise<{ predictedEta: string; analysis: string } | null> {
  try {
    const prompt = `
      Perform a neural logistics forecast for Shipment ${shipment.id} (${shipment.name}).
      Target: ${shipment.destination}. Current Progress: ${shipment.progress}%.
      Base Scheduled ETA: ${shipment.eta}. 
      Status: ${shipment.status}. Priority: ${shipment.priority}.
      
      Environmental Factors:
      ${nearbyDisruptions.length > 0 
        ? nearbyDisruptions.map(d => `- ${d.type} anomaly (Severity: ${d.severity}) at ${d.location.lat}, ${d.location.lng}`).join('\n')
        : "No immediate geographic anomalies detected in current sector."
      }
      
      Predict the likely true arrival time considering buffer requirements, potential cascade delays, and current velocity.
      Provide a highly technical but concise analysis.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "One sentence technical analysis of factors affecting the ETA." },
            predictedEta: { type: Type.STRING, description: "Predicted arrival timestamp (ISO format) or specific day/time string." }
          },
          required: ["analysis", "predictedEta"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Prediction Error:", error);
    return null;
  }
}
