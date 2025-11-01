import * as ort from "onnxruntime-web";

const FEATURE_ORDER = [
  "AGE", "BMI", "PA_ANY", "SMOKING_IDX", "HTN_FLAG", "STRESS_SCORE",
  "PA_INDEX", "STRESSxPA", "ALC_FLAG", "CHOL_FLAG", "CHOL_SCREEN",
  "EXER_FREQ_WK", "STRENGTH_FREQ", "INSURED_FLAG", "ACTIVITY_TYPE_CODE", "SEX_MALE"
];


export async function runGlucoseModel(inputData: number[]) {
  const session = await ort.InferenceSession.create("./nhanes_diabetes.onnx");
  const inputTensor = new ort.Tensor("float32", Float32Array.from(inputData), [1, inputData.length]);
  const feeds: Record<string, ort.Tensor> = { [session.inputNames[0]]: inputTensor };

  const results = await session.run(feeds);

  //output keys
  const label = results["label"];
  const probs = results["probabilities"];

  const labelArray = label instanceof ort.Tensor ? Array.from(label.data as any[]) : [];
  const probArray = probs instanceof ort.Tensor ? Array.from(probs.data as any[]) : [];

  // Convert any BigInts to numbers before returning
  const clean = (v: any) => (typeof v === "bigint" ? Number(v) : v);
  return {
    label: clean(labelArray[0]),
    probabilities: probArray.map(clean),
  };
}


export interface HeartResult {
  probability: number;
  label: number | null;
  probs: number[];
  category: string;
}


export async function runHeartModel(inputs: Record<string, number>): Promise<HeartResult> {
  console.log("🧩 Model Input: ", inputs);

  // Load ONNX model
  const session = await ort.InferenceSession.create("./brfss_heart.onnx");

  //Build column-wise input feed (each key = ONNX input)
  const feeds: Record<string, ort.Tensor> = {};
  for (const key of FEATURE_ORDER) {
    const value = isNaN(Number(inputs[key])) ? 0 : Number(inputs[key]);
    feeds[key] = new ort.Tensor("float32", Float32Array.from([value]), [1, 1]);
  }

  console.log("🚀 ONNX Feed Keys:", Object.keys(feeds));

  // Run inference
  const results = await session.run(feeds);
  console.log("Model Output:", results);

  //unwrap ONNX
  const probsTensor = results["probabilities"];
  const labelTensor = results["label"];

  const probs =
    probsTensor && probsTensor.data
      ? Array.from(probsTensor.data as Float32Array)
      : [];
  const label =
    labelTensor && labelTensor.data
      ? Number((labelTensor.data as BigInt64Array)[0])
      : null;

  const probability = Number(probs[1] ?? probs[0] ?? 0);

  //Convert to readable risk level
  let category = "Low";
  if (probability >= 0.3 && probability < 0.6) category = "Moderate";
  else if (probability >= 0.6) category = "High";

  return {
    probability,
    label,
    probs,
    category,
  };
}
