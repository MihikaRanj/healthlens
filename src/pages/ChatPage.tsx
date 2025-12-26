import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonInput,
    IonButton,
    IonItem,
    IonLabel,
    IonList,
    IonText,
    IonButtons,
    IonIcon,
    IonChip,
} from "@ionic/react";
import { homeOutline, sendOutline } from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import { fetchChatReply } from "../utils/chatAPI";
import { clearChatHistory } from "../utils/chatAPI";

interface ChatMessage {
    sender: "user" | "bot";
    text: string;
}

interface HealthData {
    inputs: Record<string, number>;
    result: any;
}

const ChatPage: React.FC = () => {
    const history = useHistory();
    const location = useLocation<{
        heartData?: HealthData;
        glucoData?: HealthData;
    }>();

    //Load localstorage from multiple possible sources
    const storedSummary = JSON.parse(localStorage.getItem("healthSummary") || "null");
    const storedHeart = JSON.parse(localStorage.getItem("heartRiskData") || "null");
    const storedGluco = JSON.parse(localStorage.getItem("glucoRiskData") || "null");

    const [heartData] = useState<HealthData | null>(
        location.state?.heartData ||
        storedSummary?.heart ||
        storedHeart?.heart ||
        storedHeart
    );

    const [glucoData] = useState<HealthData | null>(
        location.state?.glucoData ||
        storedSummary?.glucose ||
        storedGluco?.glucose ||
        storedGluco
    );

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    //Personalized greeting
    useEffect(() => {
        const getCategoryFromProbs = (probs?: number[]) => {
            if (!probs || probs.length !== 3) return "Unknown";
            const idx = probs.indexOf(Math.max(...probs));
            return ["Normal", "Prediabetic", "Diabetic"][idx];
        };

        const glucoCat =
            glucoData?.result?.category ||
            getCategoryFromProbs(glucoData?.result?.probabilities);

        const heartCat =
            heartData?.result?.category ||
            (typeof heartData?.result?.probability === "number"
                ? heartData.result.probability < 0.33
                    ? "Low"
                    : heartData.result.probability < 0.66
                        ? "Moderate"
                        : "High"
                : "Unknown");

        const glucoInputs = glucoData?.inputs || {};
        const heartInputs = heartData?.inputs || {};

        //Create diabetes risk summary
        const glucoSummary =
            glucoData &&
            `🩸 Glucose: ${glucoCat} risk | Age: ${glucoInputs.AGE ?? "?"}, BMI: ${glucoInputs.BMI ?? "?"
            }, Glucose: ${glucoInputs.GLU ?? "?"}, Active: ${glucoInputs.PA_ANY === 1 ? "Yes" : "No"
            }`;

        //Create heart risk summary
        const heartSummary =
            heartData &&
            `❤️ Heart: ${heartCat} risk | Age: ${heartInputs.AGE ?? "?"}, BMI: ${heartInputs.BMI ?? "?"
            }, Hypertension: ${heartInputs.HTN_FLAG === 1 ? "Yes" : "No"
            }, Smoker: ${heartInputs.SMOKING_IDX === 1 ? "Yes" : "No"}`;

        //Set message
        if (heartData && glucoData) {
            setMessages([
                {
                    sender: "bot",
                    text: `👋 Welcome back! Here’s a summary of your last health checks:\n\n${heartSummary}\n${glucoSummary}\n\nWould you like tips to improve both heart and glucose health?`,
                },
            ]);
        } else if (heartData) {
            setMessages([
                {
                    sender: "bot",
                    text: `👋 Hi! Your last heart risk check was **${heartCat}**.\n${heartSummary}\nWould you like some tips to improve heart health?`,
                },
            ]);
        } else if (glucoData) {
            setMessages([
                {
                    sender: "bot",
                    text: `👋 Hi! Your last diabetes risk check was **${glucoCat}**.\n${glucoSummary}\nWant to talk about diet or blood sugar management?`,
                },
            ]);
        } else {
            setMessages([
                {
                    sender: "bot",
                    text: "👋 Hello! I’m your health coach. How can I help you today?",
                },
            ]);
        }
    }, []);

    //Send chat to API
    const handleSend = async (customMessage?: string) => {
        const msg = customMessage || input;
        if (!msg.trim()) return;

        const userMsg: ChatMessage = { sender: "user", text: msg };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        const botReply = await fetchChatReply(msg, heartData, glucoData);

        const botMsg: ChatMessage = { sender: "bot", text: botReply };
        setMessages((prev) => [...prev, botMsg]);

        setLoading(false);
    };

    //Set quick prompts
    const quickPrompts = [
        "🍛 Show Indian meal plan for diabetes",
        "🏃 Recommend morning exercises for heart health",
        "🥗 Suggest foods to lower cholesterol",
        "😌 How to reduce stress naturally",
        "🚶 How much walking is good daily",
    ];

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Health Coach Chat</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => history.push("/")}>
                            <IonIcon icon={homeOutline} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                {/*Quickstart prompts*/}
                <div
                    style={{
                        display: "flex",
                        overflowX: "auto",
                        gap: "8px",
                        marginBottom: "12px",
                    }}
                >
                    {quickPrompts.map((p, i) => (
                        <IonChip
                            key={i}
                            color="tertiary"
                            onClick={() => handleSend(p)}
                            style={{ flexShrink: 0, cursor: "pointer" }}
                        >
                            {p}
                        </IonChip>
                    ))}
                </div>

                {/*Chat message */}
                <IonList>
                    {messages.map((msg, idx) => (
                        <IonItem key={idx} lines="none">
                            <IonLabel className="ion-text-wrap">
                                <IonText color={msg.sender === "user" ? "dark" : "success"}>
                                    <p style={{ whiteSpace: "pre-line" }}>
                                        <strong>{msg.sender === "user" ? "You" : "Coach"}:</strong>{" "}
                                        {msg.text}
                                    </p>
                                </IonText>
                            </IonLabel>
                        </IonItem>
                    ))}
                </IonList>

                {loading && <p style={{ textAlign: "center", color: "gray" }}>Thinking...</p>}
            </IonContent>

            <IonFooter>
                <IonItem lines="none">
                    <IonInput
                        placeholder="Ask about diet, exercise, recipes..."
                        value={input}
                        onIonChange={(e) => setInput(e.detail.value!)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <IonButton onClick={() => handleSend()} disabled={loading}>
                        <IonIcon icon={sendOutline} slot="icon-only" />
                    </IonButton>
                </IonItem>

                <IonButton onClick={() => { clearChatHistory(); window.location.reload(); }}>
                    🗑️ New Chat
                </IonButton>

            </IonFooter>
        </IonPage>
    );
};

export default ChatPage;