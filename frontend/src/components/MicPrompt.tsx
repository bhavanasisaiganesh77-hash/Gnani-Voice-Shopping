import { useRef, useState } from "react";
import { api } from "../services/api";
import {
  Mic,
  Square,
  Volume2,
  ShoppingCart,
  Loader2,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext.tsx";
import { useCart } from "../context/CartContext.tsx";
import type { Product, Language } from "../types/catalog.ts";

type MatchedItem = {
  product: Product;
  quantity: number;
};

const languageCodes: Record<Language, string> = {
  en: "en-IN",
  te: "te-IN",
  ta: "ta-IN",
};

const aliases: Record<string, string[]> = {
  rice: ["బియ్యం", "అన్నం", "அரிசி", "rice"],
  "urad-dal": [
    "మినపప్పు",
    "மினபருப்பு",
    "உளுத்தம் பருப்பு",
    "urad dal",
  ],
  "aashirvaad-atta": [
    "ఆటా",
    "గోధుమ పిండి",
    "கோதுமை மாவு",
    "atta",
    "wheat flour",
  ],
  "upma-rava": [
    "ఉప్మా రవ్వ",
    "రవ్వ",
    "உப்மா ரவை",
    "ரவை",
    "rava",
  ],
  "toor-dal": [
    "కంది పప్పు",
    "துவரம் பருப்பு",
    "toor dal",
  ],
  sugar: ["చక్కెర", "சர்க்கரை", "sugar"],
};

const numberWords: Record<string, number> = {
  // English
  one: 1,
  a: 1,
  an: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,

  // Telugu
  ఒక: 1,
  ఒక్క: 1,
  ఒకటి: 1,
  రెండు: 2,
  మూడు: 3,
  నాలుగు: 4,
  ఐదు: 5,

  // Tamil
  ஒரு: 1,
  ஒன்று: 1,
  இரண்டு: 2,
  மூன்று: 3,
  நான்கு: 4,
  ஐந்து: 5,
};

function getQuantity(text: string): number {
  const digit = text.match(/\b(\d+)\b/);

  if (digit) {
    return Math.max(1, Math.min(50, Number(digit[1])));
  }

  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    if (numberWords[word] !== undefined) {
      return numberWords[word];
    }
  }

  return 1;
}

function matchProducts(
  transcript: string,
  products: Product[],
): MatchedItem[] {
  const normalized = transcript.toLowerCase().trim();

  const mentions: {
    product: Product;
    start: number;
    end: number;
  }[] = [];

  for (const product of products) {
    const id = product.id.toLowerCase();

    const names = [
      product.names.en,
      product.names.te,
      product.names.ta,
      product.brand,
      id.replace(/-/g, " "),
      ...(aliases[id] ?? []),
    ].filter(Boolean);

    let earliest: {
      start: number;
      end: number;
    } | null = null;

    for (const name of names) {
      const value = name.toLowerCase().trim();

      if (value.length < 2) continue;

      const start = normalized.indexOf(value);

      if (
        start !== -1 &&
        (!earliest || start < earliest.start)
      ) {
        earliest = {
          start,
          end: start + value.length,
        };
      }
    }

    if (earliest) {
      mentions.push({
        product,
        ...earliest,
      });
    }
  }

  mentions.sort((a, b) => a.start - b.start);

  return mentions
    .map((mention, index) => {
      const previousEnd =
        index === 0 ? 0 : mentions[index - 1].end;

      const quantityText = normalized.slice(
        previousEnd,
        mention.start,
      );

      const requestedQuantity = getQuantity(quantityText);

      return {
        product: mention.product,
        quantity: Math.min(
          requestedQuantity,
          mention.product.stock,
        ),
      };
    })
    .filter((item) => item.quantity > 0);
}

// Convert Chrome-recorded audio into WAV for Gnani Prisma.
async function convertToWav(blob: Blob): Promise<Blob> {
  const AudioContextClass =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error(
      "Your browser does not support audio processing.",
    );
  }

  const audioContext = new AudioContextClass();

  try {
    const buffer = await audioContext.decodeAudioData(
      await blob.arrayBuffer(),
    );

    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const frameCount = buffer.length;
    const bytesPerSample = 2;
    const dataSize =
      frameCount * channels * bytesPerSample;

    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    function writeString(offset: number, value: string) {
      for (let i = 0; i < value.length; i++) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);

    view.setUint32(
      28,
      sampleRate * channels * bytesPerSample,
      true,
    );

    view.setUint16(
      32,
      channels * bytesPerSample,
      true,
    );

    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    let offset = 44;

    for (let i = 0; i < frameCount; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, buffer.getChannelData(channel)[i]),
        );

        const pcm =
          sample < 0
            ? sample * 32768
            : sample * 32767;

        view.setInt16(offset, pcm, true);
        offset += 2;
      }
    }

    return new Blob([wavBuffer], {
      type: "audio/wav",
    });
  } finally {
    await audioContext.close();
  }
}

export function MicPrompt() {
  const { t, language } = useLanguage();

  const {
    products,
    ready,
    addProduct,
  } = useCart();

  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [matchedItems, setMatchedItems] = useState<
    MatchedItem[]
  >([]);
  const [message, setMessage] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function sendAudio(blob: Blob) {
    setLoading(true);
    setMessage("");
    setTranscript("");
    setMatchedItems([]);

    try {
      const wavBlob = await convertToWav(blob);

      const formData = new FormData();

      formData.append(
        "audio_file",
        wavBlob,
        "voice-order.wav",
      );

      formData.append(
        "language_code",
        languageCodes[language],
      );

      formData.append(
        "preferred_language",
        languageCodes[language],
      );

      const baseURL = api.defaults.baseURL;

      if (!baseURL) {
        throw new Error(
          "Backend URL is not configured. Please check VITE_API_BASE_URL.",
        );
      }

      const response = await fetch(
        `${baseURL.replace(/\/+$/, "")}/stt`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Transcription failed.",
        );
      }

      const recognizedText =
        result.transcript?.trim();

      if (!recognizedText) {
        throw new Error(
          "No speech was recognized. Please try again.",
        );
      }

      setTranscript(recognizedText);

      if (!ready) {
        setMessage(
          "Products are still loading. Please try again.",
        );
        return;
      }

      const matches = matchProducts(
        recognizedText,
        products,
      );

      if (matches.length === 0) {
        setMessage(
          "I couldn't identify any matching products. Please try saying the product names clearly.",
        );
        return;
      }

      setMatchedItems(matches);

      if (matches.length === 1) {
        setMessage(
          "One matching product was identified.",
        );
      } else {
        setMessage(
          `${matches.length} matching products identified. Please review your order.`,
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to process your voice request.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      setMessage("");
      setTranscript("");
      setMatchedItems([]);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone access is unavailable. Please open the application in Chrome.",
        );
      }

      if (!window.MediaRecorder) {
        throw new Error(
          "Your browser does not support audio recording.",
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
      ].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(
          chunksRef.current,
          {
            type: recorder.mimeType || "audio/webm",
          },
        );

        stream
          .getTracks()
          .forEach((track) => track.stop());

        if (audioBlob.size > 0) {
          await sendAudio(audioBlob);
        } else {
          setMessage(
            "No audio recorded. Please try again.",
          );
        }
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not start microphone.",
      );
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setRecording(false);
    }
  }

  function addMatchedProducts() {
    if (matchedItems.length === 0) return;

    let addedCount = 0;

    for (const item of matchedItems) {
      for (let i = 0; i < item.quantity; i++) {
        addProduct(item.product.id);
        addedCount++;
      }
    }

    setMessage(
      `${addedCount} items from ${matchedItems.length} products added to your cart.`,
    );

    setMatchedItems([]);
  }

  const estimatedTotal = matchedItems.reduce(
    (sum, item) =>
      sum + item.product.price * item.quantity,
    0,
  );

  return (
    <section className="rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-green-100">
      <button
        type="button"
        aria-label={
          recording ? "Stop recording" : t.micLabel
        }
        aria-pressed={recording}
        disabled={loading}
        onClick={
          recording ? stopRecording : startRecording
        }
        className="mx-auto grid h-36 w-36 place-items-center rounded-full bg-citrus text-white shadow-lg transition hover:brightness-110 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-citrus"
      >
        {loading ? (
          <Loader2
            size={60}
            className="animate-spin"
          />
        ) : recording ? (
          <Square size={54} />
        ) : (
          <Mic
            size={64}
            strokeWidth={1.75}
          />
        )}
      </button>

      <p className="mt-4 text-lg font-semibold text-grove-dark">
        {loading
          ? "Understanding your order..."
          : recording
            ? "Listening... Tap to stop"
            : t.micLabel}
      </p>

      <p className="mt-1 text-base text-slate-600">
        {recording
          ? "Speak your grocery request clearly."
          : t.micHint}
      </p>

      {transcript && (
        <div className="mt-4 rounded-2xl bg-green-50 p-4 text-left">
          <p className="flex items-center gap-2 font-semibold text-grove-dark">
            <Volume2 size={18} />
            Recognized speech
          </p>

          <p className="mt-2 text-lg text-slate-700">
            {transcript}
          </p>
        </div>
      )}

      {matchedItems.length > 0 && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-white p-4 text-left">
          <p className="font-semibold text-grove-dark">
            Review your voice order
          </p>

          <div className="mt-3 space-y-3">
            {matchedItems.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-green-50 p-3"
              >
                <div>
                  <p className="font-bold text-grove-dark">
                    {item.product.names[language]}
                  </p>

                  <p className="text-sm text-slate-600">
                    {item.product.brand} · {item.product.unit}
                  </p>

                  <p className="text-sm text-slate-600">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <p className="font-bold text-grove-dark">
                  ₹
                  {(
                    item.product.price * item.quantity
                  ).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-lg font-bold text-grove-dark">
            Estimated total: ₹
            {estimatedTotal.toFixed(2)}
          </p>

          <button
            type="button"
            onClick={addMatchedProducts}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800"
          >
            <ShoppingCart size={20} />
            Add all to cart
          </button>
        </div>
      )}

      {message && (
        <p
          className="mt-4 rounded-2xl bg-orange-50 p-4 text-left text-sm text-grove-dark"
          role="status"
        >
          {message}
        </p>
      )}
    </section>
  );
}