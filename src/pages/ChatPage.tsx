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
    IonText,
    IonButtons,
    IonIcon,
    IonChip,
} from "@ionic/react";
import { homeOutline, sendOutline } from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import { fetchChatReply, clearChatHistory } from "../utils/chatAPI";

interface ChatMessage {
    sender: "user" | "bot";
    text: string;
}

interface HealthData {
    inputs: Record<string, number>;
    result: any;
}

const bubbleBase: React.CSSProperties = {
    maxWidth: "88%",
    padding: "11px 13px",
    borderRadius: "16px",
    lineHeight: 1.55,
    fontSize: "0.97rem",
    whiteSpace: "pre-line",
    wordBreak: "break-word",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const ChatPage: React.FC = () => {
    const history = useHistory();
    const location = useLocation<{
        heartData?: HealthData;
        glucoData?: HealthData;
    }>();

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

        const glucoSummary =
            glucoData &&
            `Glucose check: ${glucoCat}\nAge: ${glucoInputs.AGE ?? "?"}, BMI: ${glucoInputs.BMI ?? "?"
            }, Blood sugar: ${glucoInputs.GLU ?? "?"}, Active: ${glucoInputs.PA_ANY === 1 ? "Yes" : "No"
            }`;

        const heartSummary =
            heartData &&
            `Heart check: ${heartCat}\nAge: ${heartInputs.AGE ?? "?"}, BMI: ${heartInputs.BMI ?? "?"
            }, High blood pressure: ${heartInputs.HTN_FLAG === 1 ? "Yes" : "No"
            }, Smoking: ${heartInputs.SMOKING_IDX === 1 ? "Yes" : "No"}`;

        if (heartData && glucoData) {
            setMessages([
                {
                    sender: "bot",
                    text:
                        `Hi! Here is a quick summary of your recent health checks:\n\n` +
                        `${heartSummary}\n\n${glucoSummary}\n\n` +
                        `You can ask about food, exercise, stress, or ways to improve both results.`,
                },
            ]);
        } else if (heartData) {
            setMessages([
                {
                    sender: "bot",
                    text:
                        `Hi! Here is your recent heart health summary:\n\n` +
                        `${heartSummary}\n\n` +
                        `Ask about exercise, food choices, cholesterol, stress, or heart-healthy routines.`,
                },
            ]);
        } else if (glucoData) {
            setMessages([
                {
                    sender: "bot",
                    text:
                        `Hi! Here is your recent glucose health summary:\n\n` +
                        `${glucoSummary}\n\n` +
                        `Ask about meals, blood sugar habits, weight management, or daily activity.`,
                },
            ]);
        } else {
            setMessages([
                {
                    sender: "bot",
                    text:
                        "Hi! I’m your health coach. Ask me about food, exercise, stress, or healthy daily habits.",
                },
            ]);
        }
    }, [heartData, glucoData]);

    const handleSend = async (customMessage?: string) => {
        const msg = (customMessage || input).trim();
        if (!msg || loading) return;

        const userMsg: ChatMessage = { sender: "user", text: msg };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const botReply = await fetchChatReply(msg, heartData, glucoData);
            const botMsg: ChatMessage = { sender: "bot", text: botReply };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error: any) {
            const errorCode = error?.code || "";
            const errorMessage = (error?.message || "").toLowerCase();

            let finalMessage =
                "Sorry, the health coach is unavailable right now. Please try again later.";

            if (
                errorCode === "resource-exhausted" ||
                errorCode === "functions/resource-exhausted" ||
                errorMessage.includes("daily ai chat limit")
            ) {
                finalMessage =
                    "You’ve reached today’s limit of 8 chat messages. You can still use prediction tools and view your results. AI chat will be available again tomorrow.";
            } else {
                console.error("Unexpected Chat Error:", error);
            }

            setMessages((prev) => [
                ...prev,
                {
                    sender: "bot",
                    text: finalMessage,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const quickPrompts = [
        "Breakfast ideas for stable blood sugar",
        "Morning exercises for heart health",
        "Foods that help lower cholesterol",
        "Simple ways to reduce stress",
        "Daily walking goals for better health",
    ];

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle slot="primary">Health Coach</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => history.push("/")}>
                            <IonIcon icon={homeOutline} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <div
                    style={{
                        marginBottom: "12px",
                        padding: "2px 4px 0 4px",
                    }}
                >
                    <IonText color="medium">
                        <p
                            style={{
                                textAlign: "center",
                                fontSize: "0.93rem",
                                margin: "0 0 6px 0",
                                lineHeight: 1.4,
                            }}
                        >
                            Ask about food, exercise, stress, or healthy routines.
                        </p>
                        <p
                            style={{
                                textAlign: "center",
                                fontSize: "0.84rem",
                                margin: "0 0 6px 0",
                                lineHeight: 1.4,
                            }}
                        >
                            For wellness guidance only — not medical advice.
                        </p>
                        <p
                            style={{
                                textAlign: "center",
                                fontSize: "0.84rem",
                                margin: 0,
                                lineHeight: 1.4,
                            }}
                        >
                            You can send up to 8 chat messages per day.
                        </p>
                    </IonText>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "14px",
                        justifyContent: "center",
                    }}
                >
                    {quickPrompts.map((p, i) => (
                        <IonChip
                            key={i}
                            color="tertiary"
                            onClick={() => handleSend(p)}
                            style={{
                                cursor: "pointer",
                                paddingInline: "4px",
                                maxWidth: "100%",
                            }}
                        >
                            <span
                                style={{
                                    whiteSpace: "normal",
                                    lineHeight: 1.25,
                                    fontSize: "0.9rem",
                                }}
                            >
                                {p}
                            </span>
                        </IonChip>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        paddingBottom: "8px",
                    }}
                >
                    {messages.map((msg, idx) => {
                        const isUser = msg.sender === "user";

                        return (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    justifyContent: isUser ? "flex-end" : "flex-start",
                                }}
                            >
                                <div
                                    style={{
                                        ...bubbleBase,
                                        background: isUser ? "var(--ion-color-primary)" : "#f3f4f6",
                                        color: isUser ? "white" : "#1f2937",
                                        borderBottomRightRadius: isUser ? "6px" : "16px",
                                        borderBottomLeftRadius: isUser ? "16px" : "6px",
                                    }}
                                >
                                    {!isUser && (
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                marginBottom: "5px",
                                                fontSize: "0.88rem",
                                                color: "var(--ion-color-success-shade)",
                                                letterSpacing: "0.1px",
                                            }}
                                        >
                                            Coach
                                        </div>
                                    )}
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loading && (
                    <IonText color="medium">
                        <p
                            style={{
                                textAlign: "center",
                                marginTop: "10px",
                                marginBottom: "4px",
                                fontSize: "0.9rem",
                            }}
                        >
                            Thinking...
                        </p>
                    </IonText>
                )}
            </IonContent>

            <IonFooter>
                <div
                    style={{
                        padding: "10px 12px 8px 12px",
                        borderTop: "1px solid #e5e7eb",
                        background: "#ffffff",
                    }}
                >
                    <IonItem
                        lines="none"
                        style={
                            {
                                "--background": "#f8fafc",
                                "--border-radius": "16px",
                                "--padding-start": "8px",
                                "--inner-padding-end": "6px",
                            } as React.CSSProperties
                        }
                    >
                        <IonInput
                            placeholder="Ask about meals, exercise, stress, or habits..."
                            value={input}
                            onIonChange={(e) => setInput(e.detail.value!)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            style={{
                                fontSize: "0.96rem",
                            }}
                        />
                        <IonButton
                            fill="solid"
                            onClick={() => handleSend()}
                            disabled={loading}
                            style={{
                                marginLeft: "6px",
                            }}
                        >
                            <IonIcon icon={sendOutline} slot="icon-only" />
                        </IonButton>
                    </IonItem>

                    <IonButton
                        expand="block"
                        fill="clear"
                        size="small"
                        onClick={() => {
                            clearChatHistory();
                            window.location.reload();
                        }}
                        style={{
                            marginTop: "8px",
                            color: "var(--ion-color-medium)",
                        }}
                    >
                        Start New Chat
                    </IonButton>
                </div>
            </IonFooter>
        </IonPage>
    );
};

export default ChatPage;